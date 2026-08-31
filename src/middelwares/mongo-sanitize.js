/**
 * Express 5.x Compatible MongoDB Sanitizer
 * 
 * Standard sanitizers (like express-mongo-sanitize) crash in Express 5
 * because they attempt to overwrite the req.body/req.query objects directly,
 * which are now read-only getters.
 * 
 * This custom middleware recursively mutates the properties inside the objects
 * safely without replacing the objects themselves.
 */

const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      // 1. HTTP Parameter Pollution (HPP) Protection
      // If a property is an array (e.g. ?sort=a&sort=b), take only the last value
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key][obj[key].length - 1];
      }

      // 2. NoSQL Injection Protection
      // If the key starts with $, it is a potential NoSQL injection (e.g., $gt, $where)
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        // Recursively clean nested objects
        sanitizeObject(obj[key]);
      }
    }
  }
};

export const express5MongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};
