import { Col, Row } from "react-bootstrap";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import axios from "axios";
// import products from "../../products";
import Product from "../Product";
import Message from "../Message";
import Loader from "../Loader";
import { productList } from "../../actions/productActions";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const productLists = useSelector((state) => state.productList);
  const { loading, error, products } = productLists;
  useEffect(() => {
    dispatch(productList());
  }, [dispatch]);
  return (
    <>
      <h1>Latest Products</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <Row>
          {products?.map((product) => (
            <Col key={product._id} sm={12} md={6} lg={4} xl={3} className="d-flex">
              <Product product={product} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default HomeScreen;
