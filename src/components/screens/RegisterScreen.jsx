import { Link ,useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import Message from "../Message";
import Loader from "../Loader";
import {toast} from 'react-toastify';
import { register } from "../../actions/userAction";
import FormContainer from "../FormContainer";
import { Button, Col, Form, Row, Card } from "react-bootstrap";
const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const redirect = location.search ? location.search.split("=")[1] : '/';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error, userInfo } = userRegister;
  useEffect(() => {
  if (error) {
    toast.error(error);
  }
}, [error])
  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  },[navigate, userInfo, redirect]);
  const submitHandler = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name || !name.trim()) newErrors.name = "Name is required";
    if (!email || !email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage(null);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setErrors({ password: "", confirmPassword: "" });
      return;
    }

    // clear errors and submit (normalize email)
    setErrors({});
    setMessage(null);
    const normalizedEmail = String(email).trim().toLowerCase();
    dispatch(register(name.trim(), normalizedEmail, password));
  };

  return (
    <FormContainer>
      {message && <Message variant="danger">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      <Card className="p-4 shadow-sm mt-4">
        <Card.Body>
          <h1 style={{ fontWeight: 600 }} className="mb-3 text-center">
            Sign Up
          </h1>

          <Form onSubmit={submitHandler}>
            <Form.Group controlId="name" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Name</Form.Label>
              <Form.Control
                type="name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className="py-2"
                isInvalid={!!errors.name}
              />
              {errors.name && (
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              )}
              <Form.Label style={{ fontWeight: 600 }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className="py-2"
                isInvalid={!!errors.email}
              />
              {errors.email && (
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group controlId="password" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="py-2"
                isInvalid={!!errors.password}
              />
              {errors.password && (
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              )}
             
            </Form.Group>
            <Form.Group controlId="confirmPassword" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>
                Confirm Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className="py-2"
                isInvalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 mt-2" disabled={loading}>
              Register
            </Button>
          </Form>

          <Row className="mt-3">
            <Col className="text-center">
              Have an Account?{" "}
              <Link
                to={redirect ? `/login?redirect=${redirect}` : "/login"}
              >
                Login
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </FormContainer>
  );
}

export default RegisterScreen
