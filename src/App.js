import './App.css';
import React, { useState } from 'react';

import Header from "./components/Header";
import Body from "./components/Body";
import DeviceInfoContainer from './components/containers/DeviceInfoContainer';
import ServersInfoContainer from './components/containers/ServersInfoContainer';
import SystemStatusContainer from './components/containers/SystemStatusContainer';
import DeviceHealthContainer from './components/containers/DeviceHealthContainer';
import RecoveryContainer from './components/containers/RecoveryContainer';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false); // if true, refresh contents of the container
  const [activeTab, setActiveTab] = useState('linking');

  const linkingView = (
    <Body
      layout="linking"
      left={<DeviceInfoContainer setRefreshFlag={setRefreshFlag} />}
      right={<ServersInfoContainer refreshFlag={refreshFlag} />}
    />
  );

  const monitoringView = (
    <Body
      left={<SystemStatusContainer />}
      right={(
        <>
          <RecoveryContainer />
          <DeviceHealthContainer />
        </>
      )}
    />
  );

  return (
    <>
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />
      {activeTab === 'linking' ? linkingView : monitoringView}
    </>
  );
}

export default App;
