package com.satlok.seva;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Dependency-free replacement for androidx FileProvider.
 * Serves files from the app's cache/files dirs to other apps (share sheet,
 * package installer, gallery) through short-lived grantUriPermissions.
 */
public final class ShareProvider extends ContentProvider {

    public static final String AUTH = "com.satlok.seva.share";

    public static Uri uriFor(Context c, File f) {
        String root = c.getCacheDir().getAbsolutePath();
        String files = c.getFilesDir().getAbsolutePath();
        String abs = f.getAbsolutePath();
        String seg;
        if (abs.startsWith(root)) seg = "cache/" + abs.substring(root.length() + 1);
        else if (abs.startsWith(files)) seg = "files/" + abs.substring(files.length() + 1);
        else seg = "files/" + f.getName();
        return Uri.parse("content://" + AUTH + "/" + seg);
    }

    private File resolve(Uri uri) throws FileNotFoundException {
        String path = uri.getPath();
        if (path == null || path.length() < 2) throw new FileNotFoundException("bad uri");
        path = path.substring(1);
        File base;
        if (path.startsWith("cache/")) {
            base = getContext().getCacheDir();
            path = path.substring(6);
        } else if (path.startsWith("files/")) {
            base = getContext().getFilesDir();
            path = path.substring(6);
        } else throw new FileNotFoundException("bad root");
        File f = new File(base, path);
        try {
            String canonical = f.getCanonicalPath();
            if (!canonical.startsWith(base.getCanonicalPath())) throw new FileNotFoundException("traversal");
        } catch (Exception e) { throw new FileNotFoundException("resolve"); }
        if (!f.exists() || !f.isFile()) throw new FileNotFoundException(f.getAbsolutePath());
        return f;
    }

    @Override public boolean onCreate() { return true; }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File f = resolve(uri);
        int m = "w".equals(mode) || "wt".equals(mode)
                ? ParcelFileDescriptor.MODE_WRITE_ONLY | ParcelFileDescriptor.MODE_CREATE
                : ParcelFileDescriptor.MODE_READ_ONLY;
        return ParcelFileDescriptor.open(f, m);
    }

    @Override public String getType(Uri uri) {
        String n = uri.getLastPathSegment();
        if (n == null) return "application/octet-stream";
        n = n.toLowerCase();
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".apk")) return "application/vnd.android.package-archive";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".pdf")) return "application/pdf";
        if (n.endsWith(".svbak")) return "application/octet-stream";
        return "application/octet-stream";
    }

    @Override public Cursor query(Uri uri, String[] projection, String sel, String[] args, String sort) {
        try {
            File f = resolve(uri);
            String[] cols = projection == null
                    ? new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : projection;
            MatrixCursor c = new MatrixCursor(cols, 1);
            Object[] row = new Object[cols.length];
            for (int i = 0; i < cols.length; i++) {
                if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = f.getName();
                else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = f.length();
                else row[i] = null;
            }
            c.addRow(row);
            return c;
        } catch (Exception e) { return null; }
    }

    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override public int delete(Uri uri, String s, String[] a) { return 0; }
    @Override public int update(Uri uri, ContentValues v, String s, String[] a) { return 0; }
}
