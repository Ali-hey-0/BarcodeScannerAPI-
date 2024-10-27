DOCUMENTS INCLUDES :
1-THE PROJECT MAIN STRUCTURE
2-PROJECT OPERATION METHOS
3-DEPENDENCIES AND TOOLS WE HAVE USED IN THIS PROJECT
4-HOW TO RUN PROJECT
5-PRODUCTS
6-API
7-DOWNLOAD READMI FILE PDF
8-README FILES 










______________________________________________________________________________________________________________________________________________________________________________________________________

1-THE PROJECT MAIN STRUCTURE :

├── config/
│   └── db.js            # Database connection
├── controllers/
│   ├── userController.js # User CRUD logic
│   ├── productController.js # Product CRUD logic
├── middlewares/
│   └── auth.js          # Authentication & authorization middleware
├── models/
│   ├── User.js          # User model
│   └── Product.js       # Product model
├── routes/
│   ├── userRoutes.js    # User routes
│   └── productRoutes.js # Product routes
├── utils/
│   └── jwt.js           # JWT generation logic
├── app.js               # Entry point
├── package.json

______________________________________________________________________________________________________________________________________________________________________________________________________


2-PROJECT OPERATION METHODS:
1: config/
in the folder config there is one file with name db.js -> in this file we set up connection with database and if the connections failed showing relevant error


2: controllers/
in this folder there are two files :
userController.js -> in this file we do CRUD OPERATION with users
productController.js -> in this file we do CRUD OPERATION with products


3:middlewares/
in this folder there are one file with name auth.js that  verify the token in the header of request that has been generate in file with name utils


4: models/
there are two files in this folder with names : Product.js and User.js
this files define Schemas and save them in the database


5: routes/
there are two files with names : userRouets.js and productRoutes.js that direct to the right operations by the routes names


6: utils/
in this folder there are only one file with name jwt.js that generates the token base on our JWT_SECRET that has been confiqure in the .env file


7: .env -> in this file we define such things like ip ,port,database url and passwords


8: app.js -> this is our main file that start the project

______________________________________________________________________________________________________________________________________________________________________________________________________

3-DEPENDENCIES AND TOOLS WE HAVE USED IN THIS PROJECT:

    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.3",
    "cookieparser": "^0.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.7.2",
    "morgan": "^1.10.0",
    "nodemon": "^3.1.7"


DATABASE:
AND DATABASE IS MONGODB WHICH IS UNRELATIONALS

______________________________________________________________________________________________________________________________________________________________________________________________________

4-HOW TO RUN PROJECT: -> JUST EXECUTE COMMAND node app || node app.js
______________________________________________________________________________________________________________________________________________________________________________________________________


5-PRODUCTS:PRODUCTS FUNCTIONALITY IS SAME AS USERS! 

______________________________________________________________________________________________________________________________________________________________________________________________________


6-API :API REQUESTS FOR PRODUCTS AND USERS

1_PRODUCTS:
POST   /api/products/    - Create product (Admin)
GET    /api/products/    - List all products (Public)
GET    /api/products/:id - Get product details (Public)
PUT    /api/products/:id - Update product (Admin)
DELETE /api/products/:id - Delete product (Admin)




2_USERS:
POST   /api/users/      - Create user (Protected)
POST   /api/users/login - Login user (Public)
GET    /api/users/      - List all users (Admin)
GET    /api/users/:id   - Get user details (Admin)
PUT    /api/users/:id   - Update user (Admin)
DELETE /api/users/:id   - Delete user (Admin)

_____________________________________________________________________________________________________________________________________________

7-DOWNLOAD READMI FILE PDF:

get the file from this route : /docs/download


_____________________________________________________________________________________________________________________________________________

8-README FILES :


in this file there are readme file that help you understand better the project and has three option :
1:postman file
2:README.md file 
3:README.PDF file

_____________________________________________________________________________________________________________________________________________

the AI aclaude chanegs :

You're welcome! Just a quick summary of what we achieved:
1. Set up security testing
2. Added input validation
3. Implemented authentication testing
4. Added rate limiting tests
5. Improved code coverage

The system now has good test coverage for its security features. Remember to run `npm run test:coverage` regularly when making changes to ensure security measures remain effective.

Good luck with your barcode scanner project!
