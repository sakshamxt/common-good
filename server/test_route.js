// test_route.js
import express from 'express';

const app = express();
const router = express.Router();

console.log('Attempting to define potentially problematic route...');

try {
  // Test Case 1: Correctly defined parameter
  // router.get('/user/:userId', (req, res) => {
  //   res.send('Test route with userId OK');
  // });
  // console.log('Route /user/:userId defined without immediate error.');

  // Test Case 2: THE SUSPECTED ERROR - Parameter name missing
  router.get('/user/:', (req, res) => { // <<< THIS IS THE LINE TO TEST FOR THE ERROR
    res.send('This should not be reached if path-to-regexp fails');
  });
  console.log('Route /user/: defined without immediate error. This is unexpected if it is the cause.');

} catch (e) {
  console.error('Error during route definition (caught by try-catch):', e);
}

app.use('/test', router);

app.listen(3001, () => {
  console.log('Minimal test server running on port 3001. If it started, the direct route definition did not crash path-to-regexp immediately in the way the main app does.');
  console.log('If your main app still crashes, the error is within its specific router setup or another path.');
});