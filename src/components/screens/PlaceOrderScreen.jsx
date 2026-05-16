import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutSteps from '../CheckoutSteps';
import Message from '../Message';
import Loader from '../Loader';
import CheckoutForm from '../CheckoutForm';
import PayPalButton from '../PayPalButton';
import {
  createOrder,
  createPaymentIntent,
  resetOrder,
} from '../../actions/orderActions';

const stripePromise = loadStripe(
  'pk_test_51PTJjMEHU399Ls8ZKijlXdMh3uLOhwJnHezb5wLxLWCmWxoCVrNFk8uLdowJweAUI52MvnEEPnmKDw4GAmxpoZeN00TijGwERD',
);

const PlaceOrderScreen = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);
  const orderCreate = useSelector((state) => state.orderCreate);
  const paymentIntent = useSelector((state) => state.paymentIntent);
  const { order, success, error: orderError } = orderCreate;
  const {
    clientSecret,
    loading: paymentLoading,
    error: paymentError,
  } = paymentIntent;

  const [showPayment, setShowPayment] = useState(false);

  // Reset order and payment state when cart items change
  useEffect(() => {
    dispatch(resetOrder());
    setShowPayment(false);
  }, [cart.cartItems, dispatch]);

  // Check authentication and payment method
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
    if (!cart.paymentMethod) {
      navigate('/payment');
    }
  }, [userInfo, navigate, cart.paymentMethod]);

  // Calculate Prices
  function addDecimals(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  cart.itemsPrice = addDecimals(
    cart.cartItems
      .reduce((acc, item) => acc + item.price * item.qty, 0)
      .toFixed(2),
  );
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100);
  cart.taxPrice = addDecimals(Number(0.15 * cart.itemsPrice).toFixed(2));
  cart.totalPrice = addDecimals(
    (
      Number(cart.itemsPrice) +
      Number(cart.shippingPrice) +
      Number(cart.taxPrice)
    ).toFixed(2),
  );

  // Handle placing order (PayPal flow)
  const placeOrderHandler = async () => {
    console.log('PLACE ORDER CLICKED');
    console.log('Payment method:', cart.paymentMethod);
    if (cart.paymentMethod === 'Stripe') {
      // Initialize Stripe payment
      try {
        console.log('Starting payment intent...');
        console.log(
          'Creating payment intent for amount:',
          parseFloat(cart.totalPrice),
        );
        console.log('BEFORE DISPATCHED');
        const result = await dispatch(
          createPaymentIntent(parseFloat(cart.totalPrice)),
        );
        console.log('AFTER DISPATCHED');
        console.log('Payment intent created, result:', result);
        console.log('Total price sent:', cart.totalPrice);
        setShowPayment(true);
      } catch (err) {
        console.error('Error creating payment intent:', err);
      }
    } else if (cart.paymentMethod === 'PayPal') {
      // Show PayPal button
      console.log('Showing PayPal payment option');
      setShowPayment(true);
    } else {
      // Other payment methods (create order directly)
      dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        }),
      );
    }
  };

  // Handle Stripe payment success - memoized to prevent re-renders
  const handlePaymentSuccess = useCallback(
    (paymentIntent) => {
      // Create order after successful payment
      dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: 'Stripe',
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,

          isPaid: true,
          paidAt: new Date().toISOString(),

          paymentResult: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: userInfo?.email || '',
          },
        }),
      );
    },
    [dispatch, cart, userInfo],
  );

  // Handle PayPal payment success - memoized to prevent re-renders
  const handlePayPalSuccess = useCallback(
    (paymentData) => {
      dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: 'PayPal',
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,

          isPaid: true,
          paidAt: new Date().toISOString(),

          paymentResult: {
            id: paymentData.id,
            status: paymentData.status,
            update_time: paymentData.update_time,
            email_address: paymentData.email_address,
          },
        }),
      );
    },
    [dispatch, cart, userInfo],
  );

  // Memoize PayPal order data to prevent unnecessary re-renders in PayPalButton
  const paypalOrderData = useMemo(
    () => ({
      totalPrice: parseFloat(cart.totalPrice),
      itemsPrice: parseFloat(cart.itemsPrice),
      shippingPrice: parseFloat(cart.shippingPrice),
      taxPrice: parseFloat(cart.taxPrice),
    }),
    [cart.totalPrice, cart.itemsPrice, cart.shippingPrice, cart.taxPrice],
  );

  // Memoize error handler for PayPal
  const handlePayPalError = useCallback((err) => {
    console.error('PayPal Error:', err);
  }, []);

  useEffect(() => {
    if (success && order) {
      navigate(`/order/${order._id}`);
    }
  }, [success, order, navigate]);

  // Auto-show payment form when clientSecret becomes available
  useEffect(() => {
    if (clientSecret && showPayment) {
      console.log(
        '✓ Client Secret received and showPayment is true:',
        clientSecret.substring(0, 30) + '...',
      );
    }
  }, [clientSecret, showPayment]);

  // Log when Stripe form should be shown
  useEffect(() => {
    if (cart.paymentMethod === 'Stripe' && showPayment) {
      console.log(
        'Stripe payment form should be shown. paymentLoading:',
        paymentLoading,
        'clientSecret exists:',
        !!clientSecret,
      );
    }
  }, [cart.paymentMethod, showPayment, paymentLoading, clientSecret]);

  return (
    <>
      <CheckoutSteps step1 step2 step3 />
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Address:</strong> {cart.shippingAddress.address},{' '}
                {cart.shippingAddress.city} {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Payment Method</h2>
              <strong>Method:</strong> {cart.paymentMethod}
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty.</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col>
                          {item.qty} x ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>

            {/* Show PayPal Button if PayPal is selected */}
            {cart.paymentMethod === 'PayPal' && showPayment && (
              <ListGroup.Item>
                <h2>PayPal Payment</h2>
                <PayPalButton
                  orderData={paypalOrderData}
                  onPaymentSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                />
              </ListGroup.Item>
            )}
            {cart.paymentMethod === 'Stripe' && showPayment && (
              <ListGroup.Item>
                <h2>Payment Details</h2>
                {paymentLoading ? (
                  <Loader />
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      clientSecret={clientSecret}
                      orderData={{
                        totalPrice: parseFloat(cart.totalPrice),
                      }}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <Message variant='warning'>
                    Failed to initialize payment. Please try again.
                  </Message>
                )}
              </ListGroup.Item>
            )}
            {paymentError && (
              <ListGroup.Item>
                <Message variant='danger'>{paymentError}</Message>
              </ListGroup.Item>
            )}
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>${cart.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${cart.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${cart.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong>Total</strong>
                  </Col>
                  <Col>
                    <strong>${cart.totalPrice}</strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              {orderError && (
                <ListGroup.Item>
                  <Message variant='danger'>{orderError}</Message>
                </ListGroup.Item>
              )}

              <ListGroup.Item>
                {cart.paymentMethod === 'Stripe' && showPayment ? (
                  paymentLoading && <Loader />
                ) : cart.paymentMethod === 'PayPal' && showPayment ? null : (
                  <Button
                    type='button'
                    className='btn-block w-100'
                    onClick={placeOrderHandler}
                    disabled={cart.cartItems.length === 0 || paymentLoading}
                  >
                    {paymentLoading ? 'Processing...' : 'Place Order'}
                  </Button>
                )}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PlaceOrderScreen;
