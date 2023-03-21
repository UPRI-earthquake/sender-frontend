import React from "react";
import { Container, Navbar } from 'react-bootstrap';
import styles from "./Header.module.css";
import { ReactComponent as Logo } from './upri-logo.svg';

function Header() {
  return(
    <Navbar className={styles.header} variant="dark"> 
        <Container>
            <Navbar.Brand 
              className={styles.logoText} 
              target="_blank" 
              href="https://earthquake.science.upd.edu.ph">
              <Logo className="logo"></Logo>
              rShake - CS UPRI
            </Navbar.Brand>
        </Container>
    </Navbar>
  )
}

export default Header