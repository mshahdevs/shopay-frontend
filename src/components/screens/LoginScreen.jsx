import { Link ,useLocation,useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Message from "../Message";
import Loader from "../Loader";
import { login } from "../../actions/userAction";
import FormContainer from "../FormContainer";
import { Button, Col, Form, Row, Card } from "react-bootstrap";
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();

  const redirect = location.search
  ? "/" + location.search.split("=")[1]
  : "/";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

console.log(redirect)
useEffect(() => {
  if (userInfo) {
    navigate(redirect);
  }
}, [navigate, userInfo, redirect]);

  // useEffect(() => {
  //   if (userInfo) {
  //     navigate(`/${redirect}`);
  //   }
  // },[navigate, userInfo, redirect]);
  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  return (
    <FormContainer>
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      <Card className="p-4 shadow-sm mt-4">
        <Card.Body>
          <h1 style={{ fontWeight: 600 }} className="mb-3 text-center">
            Sign In
          </h1>

          <Form onSubmit={submitHandler}>
            <Form.Group controlId="email" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-2"
              />
            </Form.Group>

            <Form.Group controlId="password" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-2"
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 mt-2">
              Sign In
            </Button>
          </Form>

          <Row className="mt-3">
            <Col className="text-center">
              New Customer?{' '}
              <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
                Register
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </FormContainer>
  );
}

export default LoginScreen
