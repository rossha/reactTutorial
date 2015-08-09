import React from 'react';
import {RouteHandler} from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

// RouteHandler is a component that renders the active child route handler. Renders components depending on the URL path.

class App extends React.Component {
  render() {
    return (
      <div>
        <Navbar />
        <RouteHandler />
        <Footer />
      </div>
    );
  }
}

export default App;