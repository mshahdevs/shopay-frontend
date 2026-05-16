import { Link ,useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import FormContainer from "../FormContainer";
import { Button, Form } from "react-bootstrap";
import { saveShippingAddress } from "../../actions/cartActions";
import CheckoutSteps from "../CheckoutSteps";
export const ShippingScreen = ()=>{
  const cart = useSelector(state => state.cart);
  const {shippingAddress} = cart;
  
  const [address, setAddress] = useState(shippingAddress?.address || '')
  const [city, setCity] = useState(shippingAddress?.city || '')
  const [postalCode, setPostalCode] = useState(shippingAddress?.postalCode || '')
  const [country, setCountry] = useState(shippingAddress?.country || '')
  const dispatch = useDispatch();
  const navigate = useNavigate();
 function submitHandler(e){
    e.preventDefault();
    dispatch(saveShippingAddress({address,city,postalCode,country}))
    navigate('/payment')
 }
  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1>Shipping</h1>
       <Form onSubmit={submitHandler}>
            <Form.Group controlId="address" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                 
                }}
                className="py-2"
               
              />
              </Form.Group>
              <Form.Group controlId="city" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>City</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                 
                }}
                className="py-2"
               
              />
              </Form.Group>
              <Form.Group controlId="postalCode" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Postal Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter postal code"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                 
                }}
                className="py-2"
               
              />
              </Form.Group>
              <Form.Group controlId="country" className="mb-3">
              <Form.Label style={{ fontWeight: 600 }}>Country</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Country Name"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                 
                }}
                className="py-2"
               
              />
              </Form.Group>
              <Button type="submit" variant="primary">Continue</Button>
              </Form>
    </FormContainer>
  )
}