import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid webhook: {exc}") from exc

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(db, data)
    elif event_type == "invoice.paid":
        _handle_invoice_paid(db, data)
    elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
        _handle_subscription_change(db, data)
    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    return {"received": True}


def _find_user(db: Session, customer_id: str | None, user_id_hint: str | None) -> User | None:
    if user_id_hint:
        user = db.query(User).filter(User.id == user_id_hint).first()
        if user:
            return user
    if customer_id:
        return db.query(User).filter(User.stripe_customer_id == customer_id).first()
    return None


def _handle_checkout_completed(db: Session, session: dict) -> None:
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    user_id_hint = (session.get("metadata") or {}).get("user_id") or session.get("client_reference_id")

    user = _find_user(db, customer_id, user_id_hint)
    if not user:
        logger.warning("checkout.session.completed: no matching user for customer=%s", customer_id)
        return

    user.stripe_customer_id = customer_id or user.stripe_customer_id
    user.stripe_subscription_id = subscription_id
    user.plan = "pro"
    user.subscription_status = "active"
    db.commit()


def _handle_invoice_paid(db: Session, invoice: dict) -> None:
    customer_id = invoice.get("customer")
    user = _find_user(db, customer_id, None)
    if not user:
        logger.warning("invoice.paid: no matching user for customer=%s", customer_id)
        return

    user.plan = "pro"
    user.subscription_status = "active"
    db.commit()


def _handle_subscription_change(db: Session, subscription: dict) -> None:
    customer_id = subscription.get("customer")
    user = _find_user(db, customer_id, None)
    if not user:
        logger.warning("subscription change: no matching user for customer=%s", customer_id)
        return

    status_value = subscription.get("status")  # active | canceled | past_due | ...
    user.subscription_status = status_value

    if status_value in ("canceled", "unpaid", "incomplete_expired"):
        user.plan = "free"
        user.stripe_subscription_id = None
    elif status_value == "active":
        user.plan = "pro"

    db.commit()
