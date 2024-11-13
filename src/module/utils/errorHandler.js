export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error", err: err.message, stack: err.stack });
      } else {
        return res.status(500).json({ message: "Catch error", err });
      }
    });
  };
};
