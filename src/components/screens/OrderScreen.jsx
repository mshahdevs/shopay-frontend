import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../CheckoutForm';
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import Loader from '../Loader';
import Message from '../Message';
import { getOrderDetails, payOrder } from '../../actions/orderActions';
import { useEffect } from 'react';
import { useState } from 'react';
import { toast } from 'react-toastify';
const OrderScreen = () => {
  const navigate = useNavigate();
  const [sdkReady, setSdkReady] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const orderDetails = useSelector((state) => state.orderDetails);
  const { loading, error, order } = orderDetails;
  const orderPay = useSelector((state) => state.orderPay);
  const {
    loading: loadingPay,
    success: successPay,
    error: errorPay,
  } = orderPay;
  const { userInfo } = useSelector((state) => state.userLogin);
  const stripePromise = loadStripe(
    'pk_test_51PTJjMEHU399Ls8ZKijlXdMh3uLOhwJnHezb5wLxLWCmWxoCVrNFk8uLdowJweAUI52MvnEEPnmKDw4GAmxpoZeN00TijGwERD',
  );

  const { id } = useParams();
  const dispatch = useDispatch();

  function addDecimals(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  if (order && order.orderItems) {
    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    );
  }

  useEffect(() => {
    if (!order || order._id !== id) {
      dispatch(getOrderDetails(id));
    }
  }, [dispatch, order, id]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  }, [error]);

  useEffect(() => {
    if (errorPay) {
      toast.error(errorPay, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  }, [errorPay]);

  useEffect(() => {
    if (successPay && id) {
      dispatch(getOrderDetails(id));
    }
  }, [successPay, id, dispatch]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
          body: JSON.stringify({ totalPrice: order.totalPrice }),
        });

        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error(err);
      }
    };

    if (order && !order.isPaid && userInfo) {
      createPaymentIntent();
    }
  }, [order, userInfo]);

  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult);
    dispatch(payOrder(id, paymentResult));
  };

  // Show loading with text when initial loading or payment processing
  if (loading || loadingPay) {
    return (
      <div className='text-center py-5'>
        <h3 className='mb-3'>Loading</h3>
        <Loader />
      </div>
    );
  }

  return error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name:</strong> {order.user.name}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong> {order.shippingAddress.address} ,
                {order.shippingAddress.city} {order.shippingAddress.postalCode},
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h1>Payment Method</h1>
              <p>
                <strong>Method:</strong> {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant='success'>Paid on {order.paidAt}</Message>
              ) : (
                <Message variant='danger'>Not Paid</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h1>Order Items</h1>
              {order.orderItems.length === 0 ? (
                <Message>Your order is empty.</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
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
                  <Col>${order.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${order.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${order.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>${order.totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && clientSecret && (
                <ListGroup.Item>
                  <h5 className='mb-3'>Pay with Stripe</h5>

                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      clientSecret={clientSecret}
                      onPaymentSuccess={(paymentIntent) => {
                        dispatch(payOrder(id, paymentIntent));
                      }}
                    />
                  </Elements>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
