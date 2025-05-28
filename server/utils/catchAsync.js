const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catches any promise rejection and passes it to next()
  };
};

export default catchAsync;