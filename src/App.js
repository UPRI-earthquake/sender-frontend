import './App.css';
import React from 'react';
import { Container, Row, Col, Stack } from 'react-bootstrap';
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import 'primeicons/primeicons.css';

import Header from "./components/Header";
import DeviceInfoContainer from './components/DeviceInfoContainer';
import ServersInfoContainer from './components/ServersInfoContainer';

function App() {
  return (
    <>
      <Stack gap={4}>
        <Header></Header>

        <Container>
          <Row>
            <Col md={4} className="mb-2">
              <DeviceInfoContainer></DeviceInfoContainer>
            </Col>

            <Col md={8} className="mb-2">
              <ServersInfoContainer></ServersInfoContainer>
            </Col>
          </Row>
        </Container>
      </Stack>
    </>
  );
}

export default App;
