import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router";
import ExploreContainer from "../components/ExploreContainer";
import {
  IntuneMAM,
  IntuneMAMAppConfig,
  IntuneMAMGroupName,
  IntuneMAMPolicy,
  IntuneMAMUser,
  IntuneMAMVersionInfo,
} from "@ionic-enterprise/intune";

import { Camera, CameraResultType } from '@capacitor/camera';

import "./Home.css";

const Home: React.FC = () => {
  const history = useHistory();

  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [user, setUser] = useState<IntuneMAMUser | null>(null);
  const [version, setVersion] = useState<IntuneMAMVersionInfo | null>(null);
  const [groupName, setGroupName] = useState<IntuneMAMGroupName | null>(null);
  const [appConfig, setAppConfig] = useState<IntuneMAMAppConfig | null>(null);
  const [policy, setPolicy] = useState<IntuneMAMPolicy | null>(null);

  useEffect(() => {
    async function getInitialData() {
      setVersion(await IntuneMAM.sdkVersion());

      IntuneMAM.addListener("appConfigChange", () => {
        console.log("App config change here");
      });
      IntuneMAM.addListener("policyChange", () => {
        console.log("Policy change here");
      });
    }
    getInitialData();
  }, []);

  useEffect(() => {
    async function getToken() {
      if (user && user.upn) {
        try {
          const tokenInfo = await IntuneMAM.acquireTokenSilent({
            scopes: ["https://graph.microsoft.com/.default"],
            ...user,
          });
          setTokenInfo(tokenInfo);
          console.log("Got token info", tokenInfo);
        } catch {
          console.error(
            "Unable to silently acquire token, getting interactive"
          );
          const tokenInfo = await IntuneMAM.acquireToken({
            scopes: ["https://graph.microsoft.com/.default"],
          });
          setTokenInfo(tokenInfo);
        }
      }
    }

    getToken();
  }, [user]);

  useEffect(() => {
    async function getAppConfig() {
      if (user && user.upn) {
        setAppConfig(await IntuneMAM.appConfig(user));
        setGroupName(await IntuneMAM.groupName(user));
        setPolicy(await IntuneMAM.getPolicy(user));
      }
    }

    getAppConfig();
  }, [user]);

  useIonViewWillEnter(async () => {
    setUser(await IntuneMAM.enrolledAccount());
  });

  const showConsole = useCallback(async () => {
    await IntuneMAM.displayDiagnosticConsole();
  }, []);

  const refreshToken = useCallback(async () => {
    console.log("Refreshing token", user);
    if (user && user.upn) {
      const tokenInfo = await IntuneMAM.acquireTokenSilent({
        scopes: ["https://graph.microsoft.com/.default"],
        ...user,
      });
      setTokenInfo(tokenInfo);
    }
  }, [user]);

  const logout = useCallback(async () => {
    if (user) {
      await IntuneMAM.deRegisterAndUnenrollAccount(user);
    }
    history.replace("/");
  }, [user]);

  const takePicture = useCallback(async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl
    });
    console.log('Got photo', photo);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
          </IonToolbar>
        </IonHeader>
        <h2>{user?.upn || "No user"}</h2>
        <h5>Token info:</h5>
        <textarea
          style={{ height: "200px", width: "100%", display: "block" }}
          value={JSON.stringify(tokenInfo ?? {}, null, 2)}
        />
        <h5>Intune MAM Version: {version?.version || "No version"}</h5>
        <h5>Group name: {groupName?.value || "No group name"}</h5>
        <h5>Policy:</h5>
        <textarea
          style={{ height: "200px", width: "100%", display: "block" }}
          value={JSON.stringify(policy ?? {}, null, 2)}
        />
        <h5>App Config:</h5>
        <textarea
          style={{ height: "200px", width: "100%", display: "block" }}
          value={JSON.stringify(appConfig ?? {}, null, 2)}
        />
        <IonButton onClick={takePicture}>Take Picture</IonButton>
        <IonButton onClick={showConsole}>Show Diagnostics Console</IonButton>
        <IonButton onClick={refreshToken}>Refresh Token</IonButton>
        <IonButton onClick={logout}>Log out</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
