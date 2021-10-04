package com.ionicframework.intune;

import android.content.Context;
import android.content.SharedPreferences;
import android.widget.Toast;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.microsoft.identity.client.AuthenticationCallback;
import com.microsoft.identity.client.IAccount;
import com.microsoft.identity.client.IAuthenticationResult;
import com.microsoft.identity.client.ICurrentAccountResult;
import com.microsoft.identity.client.exception.MsalException;
import com.microsoft.identity.client.exception.MsalIntuneAppProtectionPolicyRequiredException;
import com.microsoft.identity.client.exception.MsalUserCancelException;
import com.microsoft.intune.mam.client.MAMSDKVersion;
import com.microsoft.intune.mam.client.app.MAMComponents;
import com.microsoft.intune.mam.client.identity.MAMPolicyManager;
import com.microsoft.intune.mam.policy.AppPolicy;
import com.microsoft.intune.mam.policy.MAMEnrollmentManager;
import com.microsoft.intune.mam.policy.appconfig.MAMAppConfig;
import com.microsoft.intune.mam.policy.appconfig.MAMAppConfigManager;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "IntuneMAM")
public class IntunePlugin extends Plugin {

  private static final String SETTINGS_PATH = "io.ionic.starter";

  public static final String[] MSAL_SCOPES = { "https://graph.microsoft.com/User.Read" };

  AppAccount mUserAccount;

  MAMEnrollmentManager mEnrollmentManager;

  PluginCall mLastEnrollCall;

  @Override
  public void load() {
    super.load();
    mEnrollmentManager = MAMComponents.get(MAMEnrollmentManager.class);

    final SharedPreferences prefs = getContext().getSharedPreferences(SETTINGS_PATH, Context.MODE_PRIVATE);
    mUserAccount = AppAccount.readFromSettings(prefs);
  }

  private void _acquireToken(PluginCall call, boolean interactive) {
    mLastEnrollCall = call;

    String upn = call.getString("upn");

    String[] scopesArray = null;

    try {
      JSArray scopes = call.getArray("scopes");
      scopesArray = scopes.toList().toArray(new String[0]);
    } catch (Exception ex) {
      call.reject("Must provide scopes list", ex);
      return;
    }

    final String[] scopes = scopesArray;

    // initiate the MSAL authentication on a background thread
    Thread thread = new Thread(
            () -> {
              Logger.info("Starting interactive auth");

              try {
                if (interactive) {
                  MSALUtil.acquireToken(getActivity(), MSAL_SCOPES, null, new AuthCallback());
                } else {
                  MSALUtil.acquireTokenSilent(getActivity(), upn, scopes, new AuthCallback());
                }
              } catch (MsalException | InterruptedException e) {
                Logger.error("Authentication exception occurred", e);
                showMessage("Authentication exception occurred - check logcat for more details.");
              }
            }
    );
    thread.start();
  }

  @PluginMethod
  public void acquireToken(PluginCall call) {
    _acquireToken(call, true);
  }

  @PluginMethod
  public void acquireTokenSilent(PluginCall call) {
    _acquireToken(call, false);
  }

  @PluginMethod
  public void registerAndEnrollAccount(PluginCall call) {
    if (mUserAccount != null) {
      mEnrollmentManager.registerAccountForMAM(mUserAccount.getUPN(), mUserAccount.getAADID(), mUserAccount.getTenantID(), mUserAccount.getAuthority());
    } else {
      call.reject("No user account. Call acquireToken first");
      return;
    }
    call.resolve();
  }

  @PluginMethod
  public void loginAndEnrollAccount(PluginCall call) {
    mLastEnrollCall = call;

    // initiate the MSAL authentication on a background thread
    Thread thread = new Thread(
            () -> {
              Logger.info("Starting interactive auth");

              try {
                String loginHint = null;
                if (mUserAccount != null) {
                  loginHint = mUserAccount.getUPN();
                }
                MSALUtil.acquireToken(getActivity(), MSAL_SCOPES, loginHint, new AuthCallback());
              } catch (MsalException | InterruptedException e) {
                Logger.error("Authentication exception occurred", e);
                showMessage("Authentication exception occurred - check logcat for more details.");
              }
            }
    );
    thread.start();
  }

  @PluginMethod
  public void enrolledAccount(PluginCall call) {
    JSObject data = new JSObject();
    if (mUserAccount != null) {
      data.put("upn", mUserAccount.getUPN());
    } else {
      data.put("upn", "");
    }
    call.resolve(data);
  }

  @PluginMethod
  public void deRegisterAndUnenrollAccount(PluginCall call) {
    // Initiate an MSAL sign out on a background thread.
    final AppAccount effectiveAccount = mUserAccount;

    Thread thread = new Thread(
            () -> {
              try {
                MSALUtil.signOutAccount(getContext(), effectiveAccount.getAADID());
                call.resolve();
              } catch (MsalException | InterruptedException e) {
                call.reject("Unable to log user out", e);
                Logger.error("Failed to sign out user " + effectiveAccount.getAADID(), e);
              }

              mEnrollmentManager.unregisterAccountForMAM(effectiveAccount.getUPN());

              final SharedPreferences prefs = getContext().getSharedPreferences(SETTINGS_PATH, Context.MODE_PRIVATE);
              AppAccount.clearFromSettings(prefs);

              mUserAccount = null;
            }
    );
    thread.start();
  }

  @PluginMethod
  public void appConfig(PluginCall call) {
    String upn = call.getString("upn");

    if (upn == null) {
      call.reject("No upn provided");
      return;
    }

    MAMAppConfigManager configManager = MAMComponents.get(MAMAppConfigManager.class);
    MAMAppConfig appConfig = configManager.getAppConfig(upn);

    JSObject data = new JSObject();
    data.put("fullData", appConfig.getFullData());
    call.resolve(data);
  }

  @PluginMethod
  public void groupName(PluginCall call) {
    String upn = call.getString("upn");

    if (upn == null) {
      call.reject("No upn provided");
      return;
    }

    MAMAppConfigManager configManager = MAMComponents.get(MAMAppConfigManager.class);
    MAMAppConfig data = configManager.getAppConfig(upn);

    String groupNameKey = "GroupName";

    String groupName;

    if (!data.hasConflict(groupNameKey)) {
      groupName = data.getStringForKey(groupNameKey, MAMAppConfig.StringQueryType.Any);
    } else {
      groupName = data.getStringForKey(groupNameKey, MAMAppConfig.StringQueryType.Max);
    }

    call.resolve(
            new JSObject() {
              {
                put("value", groupName);
              }
            }
    );
  }

  @PluginMethod
  @SuppressWarnings("unused")
  public void getPolicy(PluginCall call) {
    AppPolicy policy = MAMPolicyManager.getPolicy(getActivity());

    JSObject data = new JSObject();
    data.put("contactSyncAllowed", policy.getIsContactSyncAllowed());
    data.put("pinRequired", policy.getIsPinRequired());
    data.put("managedBrowserRequired", policy.getIsManagedBrowserRequired());
    data.put("screenCaptureAllowed", policy.getIsScreenCaptureAllowed());
    call.resolve(data);
  }

  @PluginMethod
  public void sdkVersion(PluginCall call) {
    MAMSDKVersion version = MAMComponents.get(MAMSDKVersion.class);

    JSObject data = new JSObject();
    data.put("version", version.VER_MAJOR + "." + version.VER_MINOR + "." + version.VER_PATCH);
    call.resolve(data);
  }

  @PluginMethod
  public void displayDiagnosticConsole(PluginCall call) {
    MAMPolicyManager.showDiagnostics(getContext());
    call.resolve();
  }

  private void showMessage(final String message) {
    bridge
            .getActivity()
            .runOnUiThread(
                    () -> {
                      Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
                    }
            );
  }

  private class AuthCallback implements AuthenticationCallback {

    @Override
    public void onError(final MsalException exc) {
      Logger.error("authentication failed", exc);

      if (mLastEnrollCall != null) {
        mLastEnrollCall.reject("Authentication error", exc);
        mLastEnrollCall = null;
      }

      if (exc instanceof MsalIntuneAppProtectionPolicyRequiredException) {
        MsalIntuneAppProtectionPolicyRequiredException appException = (MsalIntuneAppProtectionPolicyRequiredException) exc;

        // Note: An app that has enabled APP CA with Policy Assurance would need to pass these values to `remediateCompliance`.
        // For more information, see https://docs.microsoft.com/en-us/mem/intune/developer/app-sdk-android#app-ca-with-policy-assurance
        final String upn = appException.getAccountUpn();
        final String aadid = appException.getAccountUserId();
        final String tenantId = appException.getTenantId();
        final String authorityURL = appException.getAuthorityUrl();

        // The user cannot be considered "signed in" at this point, so don't save it to the settings.
        mUserAccount = new AppAccount(upn, aadid, tenantId, authorityURL);

        final String message = "Intune App Protection Policy required.";
        showMessage(message);

        Logger.info("MsalIntuneAppProtectionPolicyRequiredException received.");
        Logger.info(
                String.format("Data from broker: UPN: %s; AAD ID: %s; Tenant ID: %s; Authority: %s", upn, aadid, tenantId, authorityURL)
        );
      } else if (exc instanceof MsalUserCancelException) {
        showMessage("User cancelled sign-in request");
      } else {
        showMessage("Exception occurred - check logcat");
      }
    }

    @Override
    public void onSuccess(final IAuthenticationResult result) {
      IAccount account = result.getAccount();

      final String upn = account.getUsername();
      final String aadId = account.getId();
      final String tenantId = account.getTenantId();
      final String authorityURL = account.getAuthority();
      final String token = result.getAccessToken();
      final String accountId = account.getId();

      String message = "Authentication succeeded for user " + upn;
      Logger.info(message);

      // Save the user account in the settings, since the user is now "signed in".
      mUserAccount = new AppAccount(upn, aadId, tenantId, authorityURL);

      final SharedPreferences prefs = getContext().getSharedPreferences(SETTINGS_PATH, Context.MODE_PRIVATE);
      mUserAccount.saveToSettings(prefs);

      // Register the account for MAM.
      mEnrollmentManager.registerAccountForMAM(upn, aadId, tenantId, authorityURL);

      if (mLastEnrollCall != null) {
        JSObject data = new JSObject();
        data.put("upn", upn);
        data.put("accessToken", token);
        data.put("accountIdentifier", accountId);
        mLastEnrollCall.resolve(data);
        mLastEnrollCall = null;
      }
    }

    @Override
    public void onCancel() {
      showMessage("User cancelled auth attempt");
    }
  }
}
