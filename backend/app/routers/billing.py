import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import BillingStatusOut, CheckoutSessionOut

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.stripe_secret_key


@router.post("/create-checkout-session", response_model=CheckoutSessionOut)
def create_checkout_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.plan == "pro":
        raise HTTPException(status_code=400, detail="You already have a Pro subscription")

    if not current_user.stripe_customer_id:
        customer = stripe.Customer.create(email=current_user.email)
        current_user.stripe_customer_id = customer.id
        db.commit()
        db.refresh(current_user)

    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_price_id_pro, "quantity": 1}],
        success_url=f"{settings.frontend_url}/billing?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/billing?checkout=cancelled",
        client_reference_id=str(current_user.id),
        metadata={"user_id": str(current_user.id)},
    )
    return CheckoutSessionOut(checkout_url=session.url)


@router.post("/confirm-session")
def confirm_checkout_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Called by the frontend right after the Stripe redirect back from Checkout.

    This is a reliability fallback, not a replacement for the webhook: in local dev the
    webhook only arrives if `stripe listen` is forwarding events, and even in production
    the webhook can lag the redirect by a few seconds. This endpoint verifies the session
    directly with Stripe's API (server-side, using our secret key — never trusts the
    client) and applies the same upgrade the webhook would. The webhook remains the
    authoritative path for renewals/cancellations that happen with no user in the loop.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=400, detail=f"Could not verify checkout session: {exc}") from exc

    session_user_id = (session.get("metadata") or {}).get("user_id") or session.get("client_reference_id")
    if session_user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="This checkout session does not belong to your account")

    if session.get("payment_status") != "paid":
        return BillingStatusOut(plan=current_user.plan, subscription_status=current_user.subscription_status)

    current_user.stripe_customer_id = session.get("customer") or current_user.stripe_customer_id
    current_user.stripe_subscription_id = session.get("subscription")
    current_user.plan = "pro"
    current_user.subscription_status = "active"
    db.commit()
    db.refresh(current_user)

    return BillingStatusOut(plan=current_user.plan, subscription_status=current_user.subscription_status)


@router.post("/cancel-subscription")
def cancel_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.plan != "pro" or not current_user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active Pro subscription to cancel")

    stripe.Subscription.delete(current_user.stripe_subscription_id)
    # Immediate downgrade decision: cancel now rather than at period end.
    # DB is authoritative only once the webhook (customer.subscription.deleted) confirms it,
    # but we also reflect it optimistically here so the UI updates without waiting on the webhook race.
    current_user.plan = "free"
    current_user.subscription_status = "canceled"
    db.commit()

    return {"detail": "Subscription cancelled"}


@router.get("/status", response_model=BillingStatusOut)
def billing_status(current_user: User = Depends(get_current_user)):
    return BillingStatusOut(plan=current_user.plan, subscription_status=current_user.subscription_status)
