import { Spinner } from "react-bootstrap";

const Loader = () => {
  return (
    <Spinner
      role='status'
      animation='border'
      style={{
        width: "100px",
        height: "100px",
        margin: "auto",
        display: "block",
      }}
    ></Spinner>
  );
};

export default Loader;
