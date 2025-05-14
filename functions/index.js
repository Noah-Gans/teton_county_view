const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
console.log("Admin SDK Project ID:", admin.app().options.projectId);
const stripe = require("stripe")(functions.config().stripe.secret);
const express = require("express");
const bodyParser = require("body-parser");

// 1) createCheckoutSession (Callable Function - v1)
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const { email, userId } = data;

  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to create a checkout session."
    );
  }

  // Validate inputs
  if (!email || !userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing email or userId in request."
    );
  }

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: "price_1RM9MaLhg9Kp46ldUwF16Y8t",
          quantity: 1,
        },
      ],
      success_url: "https://tetoncountygis.com/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://tetoncountygis.com/cancel",
    
      // 1) Attach the user ID to the Checkout Session itself
      metadata: {
        firebaseUserId: userId,
      },
    
      // 2) Attach the user ID to the Subscription object
      subscription_data: {
        trial_period_days: 14, // ✅ ✅ This is the correct way now
        metadata: {
          firebaseUserId: userId,
        },
      },
    });
    

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

// 2) stripeWebhook (HTTP Function - v1)
const app = express();

// Add raw body middleware for Stripe webhook validation
app.use(
  bodyParser.raw({
    type: "application/json",
  })
);

app.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (!session.metadata?.firebaseUserId) {
          throw new Error("Missing Firebase User ID in session metadata");
        }
        const userId = session.metadata.firebaseUserId;
      
        // 1) Mark subscriptionStatus as 'active'
        await admin.firestore().collection("users").doc(userId).set(
          { subscriptionStatus: "active" },
          { merge: true }
        );
      
        // 2) Also store the Stripe customer ID so we can create a portal session later
        // session.customer => The Stripe Customer ID
        const customerId = session.customer; 
        // or session.customer_details?.customer_id in older versions, but usually session.customer works
      
        await admin.firestore().collection("users").doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      
        console.log("Subscription activated for user:", userId, "with customer:", customerId);
        break;
      }
      

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object;
        console.log("Payment failed for invoice:", failedInvoice.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (!subscription.metadata || !subscription.metadata.firebaseUserId) {
          throw new Error("Missing Firebase User ID in subscription metadata");
        }

        const userId = subscription.metadata.firebaseUserId;
        await admin.firestore().collection("users").doc(userId).set(
          { subscriptionStatus: "canceled" },
          { merge: true }
        );
        console.log("Subscription canceled for user:", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        if (!subscription.metadata || !subscription.metadata.firebaseUserId) {
          throw new Error("Missing Firebase User ID in subscription metadata");
        }
      
        const userId = subscription.metadata.firebaseUserId;
      
        // Check the subscription's status
        // (e.g., if subscription.status === "active", set Firestore to "active")
        if (subscription.status === "active") {
          await admin.firestore().collection("users").doc(userId).set(
            { subscriptionStatus: "active" },
            { merge: true }
          );
          console.log("Subscription re-activated for user:", userId);
        } else {
          // Optionally handle other states like "past_due", "incomplete", etc.
          console.log("Subscription updated with status:", subscription.status);
        }
        break;
      }
      

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook processed successfully");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

exports.stripeWebhook = functions.https.onRequest(app);


exports.createPortalSession = functions.https.onCall(async (data, context) => {
  // Ensure user is logged in
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to access the billing portal."
    );
  }

  const userId = context.auth.uid; // The Firebase Auth UID
  // Fetch the user's doc from Firestore
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User doc not found.");
  }

  const userData = userDoc.data();
  const customerId = userData.stripeCustomerId;
  if (!customerId) {
    throw new functions.https.HttpsError("failed-precondition", "No Stripe customer ID found for this user.");
  }

  try {
    // Create a portal session
    const returnUrl = "https://tetoncountygis.com"; 
    // The URL to which Stripe will redirect after they manage subscription
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  } catch (err) {
    console.error("Error creating billing portal session:", err);
    throw new functions.https.HttpsError("unknown", err.message);
  }
});
