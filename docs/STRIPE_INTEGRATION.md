# Stripe Integration Guide for Donations

This guide explains how to integrate Stripe for accepting donations in your Arm Wrestling Pro app.

## Important Note

Stripe integration requires server-side code to handle payments securely. This app uses Supabase Edge Functions to process Stripe payments.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Supabase project with Edge Functions support (already configured)

## Setup Steps

### 1. Get Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Go to Developers > API keys
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test mode keys

### 2. Add Environment Variables

Add to your `.env` file:

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

Add to your Supabase Edge Function secrets (these are NOT in .env):

```bash
# These are auto-configured in Supabase Edge Functions
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Create Stripe Products

1. Go to Stripe Dashboard > Products
2. Create donation products:
   - Small Donation: $5
   - Medium Donation: $10
   - Large Donation: $25
   - Custom Amount: Variable
3. Note the Price IDs for each product

### 4. Deploy Edge Function for Payment Processing

The Edge Function handles payment intent creation securely:

```typescript
// supabase/functions/create-donation-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Stripe with secret key from environment
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { amount, currency = 'usd' } = await req.json();

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 5. Install Stripe SDK in Your App

For React Native/Expo projects:

```bash
npx expo install @stripe/stripe-react-native
```

### 6. Update Profile Component

Create a donation modal with Stripe integration:

```typescript
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';

const DonationModal = ({ visible, onClose }) => {
  const { confirmPayment } = useStripe();
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) < 1) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Call your edge function to create payment intent
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-donation-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
          }),
        }
      );

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        Alert.alert('Error', backendError);
        setLoading(false);
        return;
      }

      // Confirm the payment with the card details
      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else {
        Alert.alert(
          'Thank You!',
          'Your donation has been processed successfully!'
        );
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Support Development</Text>

          <TextInput
            style={styles.input}
            placeholder="Amount ($)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <CardField
            postalCodeEnabled={false}
            style={styles.cardField}
          />

          <TouchableOpacity
            style={styles.donateButton}
            onPress={handleDonate}
            disabled={loading}
          >
            <Text style={styles.donateButtonText}>
              {loading ? 'Processing...' : `Donate $${amount}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Wrap your app with StripeProvider
export default function Profile() {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
    >
      {/* Your profile content */}
      <TouchableOpacity onPress={() => setShowDonationModal(true)}>
        <Text>Donate</Text>
      </TouchableOpacity>

      <DonationModal
        visible={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </StripeProvider>
  );
}
```

### 7. Test Your Integration

#### Test Mode

1. Use Stripe test keys
2. Use test card numbers:
   - Success: 4242 4242 4242 4242
   - Declined: 4000 0000 0000 0002
   - Requires Auth: 4000 0027 6000 3184
3. Use any future expiry date and any CVC

#### Production Mode

1. Switch to live API keys
2. Complete Stripe account verification
3. Enable payment methods in Stripe Dashboard
4. Test with real card in test environment first

## Security Best Practices

1. **Never expose your Secret Key** - Only use it in Edge Functions
2. **Always use HTTPS** - Stripe requires secure connections
3. **Validate amounts server-side** - Don't trust client inputs
4. **Handle errors gracefully** - Provide clear user feedback
5. **Log transactions** - Keep records of all donations
6. **PCI Compliance** - Let Stripe handle card data (never store cards)

## Webhooks (Optional)

To track successful payments:

1. Create a webhook endpoint in Stripe Dashboard
2. Point it to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Create an edge function to handle webhook events

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.10.0';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    if (event.type === 'payment_intent.succeeded') {
      // Handle successful payment
      // Save to database, send thank you email, etc.
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
});
```

## Resources

- Stripe Documentation: https://stripe.com/docs
- Stripe React Native: https://github.com/stripe/stripe-react-native
- Stripe Edge Functions: https://stripe.com/docs/payments/accept-a-payment
- Test Cards: https://stripe.com/docs/testing

## Support

For Stripe-specific questions:
- Stripe Support: https://support.stripe.com
- Stripe Community: https://stripe.com/community

## Current Implementation Status

- ✅ Donate button UI in Profile tab
- ✅ Documentation for Stripe integration
- ⏳ Edge function deployment (requires Stripe account)
- ⏳ Stripe SDK installation (requires local development)
- ⏳ Payment flow implementation

**Note**: Full Stripe integration requires you to export the project locally and add the Stripe React Native SDK, which requires native modules not available in the browser preview.
