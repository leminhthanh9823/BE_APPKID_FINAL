# Base image
FROM node:22

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose port from env
EXPOSE ${PORT}

# Start app
CMD ["npm", "start"]
