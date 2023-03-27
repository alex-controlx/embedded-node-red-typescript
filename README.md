# Embedded Node RED with Typescript
This is a template for creating a Node RED project with Typescript. It has a basic setup for a Node RED project
with a few example nodes. It also has a basic setup for a Typescript project with a few entry level files.

## Requirements
To use this template you will need to have the following installed:
  - Node.js v18.0.0 or higher

## Starting the Project
To start the project, you will need to clone the repository and install the dependencies. Follow the steps 
below to get started:
```bash
git clone git@github.com:alex-controlx/embedded-node-red-typescript.git
cd embedded-node-red-typescript
npm install
npm start
```

## Basic Usage
After starting the project, you can access the Node RED editor at http://localhost:1880. To communicate from the 
Node-RED editor to the Typescript project, you can use the function nodes. To send data from Node-RED to the
project use the following code in the function node:
```javascript
// give a name for the node, e.g. '__example_from_node_red'
global.get('backend').send(node, msg)
```

To receive data from the project to Node-RED, you can use the following code in the function node:
```javascript
// give a name for the node, e.g. '__example_from_backend'
// and in "On Start" tab add the following code:
global.get('backend').on(node);
```
