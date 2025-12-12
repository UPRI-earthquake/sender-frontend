import './App.css';
import React, { useState } from 'react';

import Header from "./components/Header";
import Body from "./components/Body";
import DeviceInfoContainer from './components/containers/DeviceInfoContainer';
import ServersInfoContainer from './components/containers/ServersInfoContainer';
import SystemStatusContainer from './components/containers/SystemStatusContainer';
import DeviceHealthContainer from './components/containers/DeviceHealthContainer';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false) // if true, refresh contents of the container

  return (
    <>
      <Header />
      <Body
        left={(
          <>
            {/* PR note: Workflow left column keeps device + server setup ordered for operators */}
            <DeviceInfoContainer setRefreshFlag={setRefreshFlag}/>
            <ServersInfoContainer refreshFlag={refreshFlag}/>
          </>
        )}
        right={(
          <>
            <SystemStatusContainer />
            <DeviceHealthContainer />
          </>
        )}
      />
    </>
  );
}

export default App;
