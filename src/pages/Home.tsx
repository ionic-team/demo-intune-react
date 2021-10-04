import "./Home.css";
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
import type {
  IntuneMAMAppConfig,
  IntuneMAMGroupName,
  IntuneMAMPlugin,
  IntuneMAMPolicy,
  IntuneMAMUser,
  IntuneMAMVersionInfo,
} from "@ionic-enterprise/intune/cordova/definitions";

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
      const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
      setVersion(await IntuneMAM.sdkVersion());

      /*
      IntuneMAM.addListener("appConfigChange", () => {
        console.log("App config change here");
      });
      IntuneMAM.addListener("policyChange", () => {
        console.log("Policy change here");
      });
      */
    }

    document.addEventListener(
      "deviceready",
      async () => {
        getInitialData();
      },
      false
    );
  }, []);

  useEffect(() => {
    async function getToken() {
      const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
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

    document.addEventListener(
      "deviceready",
      async () => {
        getToken();
      },
      false
    );
  }, [user]);

  useEffect(() => {
    async function getAppConfig() {
      const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
      if (user && user.upn) {
        setAppConfig(await IntuneMAM.appConfig(user));
        setGroupName(await IntuneMAM.groupName(user));
        setPolicy(await IntuneMAM.getPolicy(user));
      }
    }

    getAppConfig();
  }, [user]);

  useIonViewWillEnter(async () => {
    document.addEventListener(
      "deviceready",
      async () => {
        const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
        setUser(await IntuneMAM.enrolledAccount());
      },
      false
    );
  });

  const showConsole = useCallback(async () => {
    const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
    await IntuneMAM.displayDiagnosticConsole();
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;
      await IntuneMAM.deRegisterAndUnenrollAccount(user);
    }
    history.replace("/");
  }, [user]);

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
        <IonButton onClick={showConsole}>Show Diagnostics Console</IonButton>
        <IonButton onClick={logout}>Log out</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
