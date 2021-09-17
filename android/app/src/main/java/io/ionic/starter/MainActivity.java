package io.ionic.starter;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

import java.security.MessageDigest;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    PackageInfo info;
    try {
      info = getPackageManager().getPackageInfo("io.ionic.starter", PackageManager.GET_SIGNATURES);
      for (Signature signature : info.signatures) {
        MessageDigest md;
        md = MessageDigest.getInstance("SHA");
        md.update(signature.toByteArray());
        String something = new String(Base64.encode(md.digest(), 0));
        //String something = new String(Base64.encodeBytes(md.digest()));
        Log.e("hash key", something);
      }
    } catch (Exception e) {
      Log.e("exception", e.toString());
    }
    super.onCreate(savedInstanceState);
  }
}
