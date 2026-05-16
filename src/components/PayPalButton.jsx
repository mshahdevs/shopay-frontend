import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Message from './Message';

const PayPalButton = ({ orderData, onPaymentSuccess, onError }) => {
  const paypalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Step 1: Load PayPal SDK on mount
  useEffect(() => {
    if (window.paypal) {
      console.log('✓ PayPal SDK already available');
      setSdkLoaded(true);
      return;
    }

    const loadSDK = async () => {
      try {
        const response = await fetch('/api/payments/paypal-client-id');
        const { clientId } = await response.json();
        console.log('Client ID fetched');

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;

        script.onload = () => {
          console.log('✓ PayPal SDK loaded');
          setSdkLoaded(true);
        };

        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setLoading(false);
        };

        document.body.appendChild(script);
      } catch (err) {
        console.error('Error fetching client ID:', err);
        setError('Failed to load PayPal');
        setLoading(false);
      }
    };

    loadSDK();
  }, []);

  // Step 2: Render button when SDK is loaded AND ref exists
  useLayoutEffect(() => {
    // This runs synchronously after DOM mutations, ensuring ref is attached
    if (!sdkLoaded || !window.paypal || !paypalRef.current || !orderData) {
      console.log('Not ready:', {
        sdkLoaded,
        hasPaypal: !!window.paypal,
        hasRef: !!paypalRef.current,
        hasOrderData: !!orderData,
      });
      return;
    }

    console.log('✓ Ref attached, rendering PayPal button...');
    renderPayPalButton();
  }, [sdkLoaded, orderData, onPaymentSuccess, onError]);

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = '';

    window.paypal
      .Buttons({
        createOrder: async (data, actions) => {
          try {
            const userInfo = localStorage.getItem('userInfo');
            const token = userInfo ? JSON.parse(userInfo).token : '';

            const response = await fetch('/api/payments/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(orderData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            console.log('✓ PayPal order created:', result.id);
            return result.id;
          } catch (err) {
            console.error('Order error:', err);
            setError(err.message);
            throw err;
          }
        },

        onApprove: async (data, actions) => {
          try {
            const userInfo = localStorage.getItem('userInfo');
            const token = userInfo ? JSON.parse(userInfo).token : '';

            const response = await fetch(
              '/api/payments/paypal/capture-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId: data.orderID }),
              },
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            console.log('✓ Payment captured:', result.id);
            onPaymentSuccess({
              id: result.id,
              status: result.status,
              email_address: result.email_address,
              update_time: result.update_time,
            });
          } catch (err) {
            console.error('Capture error:', err);
            setError(err.message);
            onError?.(err);
          }
        },

        onError: (err) => {
          console.error('PayPal error:', err);
          setError('An error occurred');
          onError?.(err);
        },

        onCancel: () => {
          console.log('Payment cancelled');
          setError('Payment cancelled');
        },
      })
      .render(paypalRef.current)
      .then(() => {
        console.log('✓ PayPal button rendered successfully');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Render error:', err);
        setError('Failed to render button');
        setLoading(false);
      });
  };

  if (error) {
    return <Message variant='danger'>{error}</Message>;
  }

  if (loading) {
    return <Message variant='info'>Loading PayPal payment button...</Message>;
  }

  return (
    <div
      ref={paypalRef}
      style={{
        marginTop: '20px',
        minHeight: '50px',
      }}
    />
  );
};

export default PayPalButton;
