import { ApiError } from "../utils/ApiError.js";

export const validate = (schema, source = "body") => (req, res, next) => {
  const data = req[source];

  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return next(
      new ApiError(JSON.stringify(errors), 400)
    );
  }

  if (source === "body") req.body = result.data;
  else if (source === "query") req.validatedQuery = result.data;
  else if (source === "params") req.params = result.data;

  next();
};