import React from 'react';
import Container from '@mui/material/Container';
import '../styles/imageGrid.scss';

export default function ImageGrid() {
  return (
    <React.Fragment>
      <div className="container">
        <div className="photo1"></div>
        <div className="photo2"></div>
        <div className="photo5"></div>
        <div className="headshot"></div>
        <div className="photo3"></div>
        <div className="photo4"></div>
      </div>
    </React.Fragment>
  );
}
