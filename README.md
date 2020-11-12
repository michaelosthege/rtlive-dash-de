# Static Dashboard Powering [R<sub>t</sub>live.de](https://rtlive.de)
This is the repository of the static website that powers https://Rtlive.de.

## Contributing
We appreciate contributions that improve this website.
First head over to [Issues](https://github.com/michaelosthege/rtlive-dash-de/issues) to look for unresolved tickets.

With respect to language localization, please understand that we are very conservative.
It is not our day job to run this site, and we are not web-developers which is why a low-maintenance static site is a high priority for us.

## Development
Follow these steps to start a webserver for local development:
1. Clone this repository
2. Unpack the contents of [this ZIP file]() into a `"data"` directory at the root of the repository.
These files are a subset of the PNG/JSON files that are served from the AWS CloudFront/S3 deployment of the real site.
3. start a [Docker container](https://www.docker.com/products/docker-desktop) of a local webserver for testing.
    1. adapt the `start.sh` file such that it points to the correct paths on your local filesystem.
    2. Then run `bash start.sh` and 
4. Visit `http://localhost:4040` with your favorite browser.
5. You can now live-edit the HTML/JS/CSS files

To contribute the changes:
1. Fork this repositor into your GitHub profile
2. Add the fork to the locally cloned repo as an alternative remote: `git remote add myfork https://github.com/myaccount/rtlive-dash-de` (run `git remote -v` to view the remotes)
3. Create a new branch & commit changes to it
4. Push that new branch to your fork: `git push --set-upstream myfork name-of-branch`
5. Open a PR in GitHub
