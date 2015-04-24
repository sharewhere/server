#!/bin/sh

die() {
  echo "[-] DIE: $1"
  exit 1
}

echo "ShareWhere server back up"
TMPDIR=`mktemp -d`

if [ $? != 0 ]; then
  die "Failed to create the temporary directory"
fi

cleanup() {
  if [ ! -z "${TMPDIR}" ]; then
    rm -rf "${TMPDIR}"
  fi
}

trap cleanup EXIT

BACKUP_NAME="ShareWhereBak-`date +%F-%s`"

mkdir "${TMPDIR}/${BACKUP_NAME}"

if [ $? != 0 ]; then
  die "Failed to create the backup directory"
fi

if [ ! -d "images/" ]; then
  read -p "[-] WARNING: failed to find an images directory. Is this okay (y/n)? " choice

  case ${choice} in
    Y*|y*) ;;
    *) die "Not continuing due to missings images dir" ;;
  esac
fi

echo "[+] Copying images (`ls images/ | wc -l` images)"

cp -r "images/" "${TMPDIR}/${BACKUP_NAME}"

if [ $? != 0 ]; then
  die "Failed to copy the images"
fi

DEST_DIR="${PWD}"

#####################
# Make the tarball
#####################

cd "${TMPDIR}/${BACKUP_NAME}"

echo "[+] Dumping database. Password required"
mysqldump -u root -p ShareWhereTest > db.sql

if [ $? != 0 ]; then
  die "Failed to dump the database"
fi

cd ..

TARBALL="${BACKUP_NAME}.tar.gz"
tar czf "${TARBALL}" "${BACKUP_NAME}"

if [ $? != 0 ]; then
  die "Failed to create tar ball"
fi

cp "${TARBALL}" "${DEST_DIR}"

if [ $? != 0 ]; then
  die "Failed to copy tar ball to ${DEST_DIR}"
fi

cd "${DEST_DIR}"

#####################

if [ ! -f "${TARBALL}" ]; then
  die "The tar ball (${TARBALL}) seems to be missing from the current directory"
else
  echo "[+] Your backup is ready at ${TARBALL}"
fi
