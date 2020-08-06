# This script starts a Docker container that serves the static site for local development.
# IMPORTANT: The permissions on the mounted path must be o+rwx !!
# Use this command: chmod -R u=rwx,g=rwx,o=rwx /repos/rtlive-dash-de
# Best practice alternatives:
# * configure nginx to use a specific uid:gid that exists on the host
# * create a nginx user on the host
 docker run \
    --rm \
    -d \
    -v /repos/rtlive-dash-de:/usr/share/nginx/html \
    -p 4040:80 --name rtlive_local \
    nginx:stable
