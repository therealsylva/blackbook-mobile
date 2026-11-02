package com.modnight.blackbook.updater

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.atomic.AtomicBoolean

class UpdateFileProvider : FileProvider()

class BlackBookUpdaterModule : Module() {
  private val busy = AtomicBoolean(false)
  private val context: Context get() = requireNotNull(appContext.reactContext)
  private val mime = "application/vnd.android.package-archive"

  override fun definition() = ModuleDefinition {
    Name("BlackBookUpdater")
    Events("progress")
    Constant("versionCode") { installed().versionNumber().toDouble() }
    Constant("version") { installed().versionName ?: "" }

    AsyncFunction("openInstallSettings") {
      if (Build.VERSION.SDK_INT >= 26) context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    AsyncFunction("downloadAndInstall") Coroutine { version: String, versionCode: Double, url: String, checksum: String? ->
      check(busy.compareAndSet(false, true)) { "An update is already downloading." }
      try {
        withContext(Dispatchers.IO) {
          check(version.matches(Regex("[0-9]+\\.[0-9]+\\.[0-9]+"))) { "Invalid update version." }
          check(url == "https://tradeblackbook.org/downloads/BlackBook-$version.apk") { "Invalid update address." }
          val target = File(requireNotNull(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)) { "Update storage is unavailable." }, "updates/BlackBook-$version.apk")
          target.parentFile?.mkdirs()
          if (!target.exists() || runCatching { validate(target, versionCode.toLong(), checksum) }.isFailure) {
            target.delete()
            download(url, target)
          }
          sendEvent("progress", mapOf("message" to "Verifying update", "percent" to 100))
          try { validate(target, versionCode.toLong(), checksum) } catch (error: Exception) { target.delete(); throw error }
          if (Build.VERSION.SDK_INT >= 26 && !context.packageManager.canRequestPackageInstalls()) {
            "permission-required"
          } else {
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", target)
            context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, mime).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION))
            "installer-opened"
          }
        }
      } finally { busy.set(false) }
    }
  }

  private suspend fun download(url: String, target: File) {
    val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val id = manager.enqueue(DownloadManager.Request(Uri.parse(url)).setTitle("BlackBook update").setMimeType(mime)
      .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
      .setDestinationUri(Uri.fromFile(target)))
    try {
      val started = System.currentTimeMillis()
      while (true) {
        check(System.currentTimeMillis() - started < 30 * 60 * 1000) { "Download timed out. Please retry." }
        manager.query(DownloadManager.Query().setFilterById(id)).use { cursor ->
          check(cursor.moveToFirst()) { "The update download was removed. Please retry." }
          fun number(name: String) = cursor.getLong(cursor.getColumnIndexOrThrow(name))
          when (number(DownloadManager.COLUMN_STATUS).toInt()) {
            DownloadManager.STATUS_SUCCESSFUL -> return
            DownloadManager.STATUS_FAILED -> error("Update download failed. Please retry.")
          }
          val total = number(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
          val percent = if (total > 0) (number(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR) * 100 / total).toInt().coerceIn(0, 100) else 0
          sendEvent("progress", mapOf("message" to "Downloading update", "percent" to percent))
        }
        delay(500)
      }
    } catch (error: Exception) {
      manager.remove(id)
      target.delete()
      throw error
    }
  }

  @Suppress("DEPRECATION")
  private fun installed(): PackageInfo = context.packageManager.getPackageInfo(context.packageName, if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES)

  @Suppress("DEPRECATION")
  private fun validate(file: File, expectedCode: Long, checksum: String?) {
    if (!checksum.isNullOrBlank()) {
      check(checksum.matches(Regex("[a-fA-F0-9]{64}"))) { "Invalid update checksum." }
      val digest = MessageDigest.getInstance("SHA-256")
      file.inputStream().buffered().use { input ->
        val buffer = ByteArray(65536)
        while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) }
      }
      check(digest.digest().joinToString("") { "%02x".format(it) }.equals(checksum, true)) { "Update verification failed. Please retry." }
    }
    val archive = context.packageManager.getPackageArchiveInfo(file.absolutePath, if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES)
    checkNotNull(archive) { "The downloaded file is not an Android app." }
    val current = installed()
    check(archive.packageName == context.packageName) { "This update belongs to a different app." }
    check(archive.versionNumber() > current.versionNumber() && (expectedCode <= 0 || archive.versionNumber() == expectedCode)) { "This update is not newer than your app." }
    val currentSigners = current.signers()
    val archiveSigners = archive.signers()
    check(currentSigners.isNotEmpty() && currentSigners == archiveSigners) { "The update signature does not match BlackBook." }
  }

  @Suppress("DEPRECATION")
  private fun PackageInfo.versionNumber(): Long = if (Build.VERSION.SDK_INT >= 28) longVersionCode else versionCode.toLong()
  @Suppress("DEPRECATION")
  private fun PackageInfo.signers(): Set<String> = (if (Build.VERSION.SDK_INT >= 28) signingInfo?.apkContentsSigners.orEmpty() else signatures.orEmpty()).mapTo(mutableSetOf()) {
    MessageDigest.getInstance("SHA-256").digest(it.toByteArray()).joinToString("") { byte -> "%02x".format(byte) }
  }
}
