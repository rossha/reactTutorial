// this file acts as the entry point for our React application. it is used in gulpfile.js where Browserify will create a final bundle.js file based on the dependencies of the app.
// rarely needs to be touched after set-up.

import React from 'react';
import Router from 'react-router';
import routes from './routes';

// React Router bootstraps the routes from the routes.js file, matches them against a URL, and executes the appropriate callback handler. 
//In this case, it renders a React component into <div id="app"></div>. The component that is rendered is determined by the URL path.
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler />, document.getElementById('app'));
});