# Cloud-Native DevOps Platform on AWS EKS

A learning project that containerizes a Python Flask application with Docker and deploys it to Kubernetes on Amazon EKS. The application exposes health and information endpoints plus Prometheus metrics.

## Architecture

![Cloud-Native DevOps Platform architecture](architecture-aws-flow-live.svg)

The diagram is an architecture illustration, not a live view of AWS. The EKS infrastructure was created and tested in **ap-south-1 (Mumbai)**, then destroyed to avoid ongoing charges. Public NodePort access was not verified; the confirmed application test used `kubectl port-forward`.

## Project features

- Flask application with configurable values from a Kubernetes ConfigMap
- Docker image built from `docker/Dockerfile`
- Amazon ECR image repository
- Kubernetes Deployment, NodePort Service, resource requests/limits, and health probes
- Prometheus-compatible `/metrics` endpoint
- Prometheus/Grafana monitoring instructions and ServiceMonitor manifest
- GitHub Actions workflow for application tests and Docker build

## Application endpoints

| Endpoint | Purpose |
|---|---|
| `/` | Application status |
| `/health` | Health check |
| `/info` | Application name, version, and environment |
| `/metrics` | Prometheus metrics |

The Flask app listens on port **5000**.

## Run locally

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r app/requirements.txt
python app/app.py
```

Open `http://localhost:5000`. Check metrics at `http://localhost:5000/metrics`.

## Build and push the image to ECR

Run from the repository root in PowerShell. The AWS CLI must be configured for an account with an ECR repository named `devops-flask-app` in `ap-south-1`.

```powershell
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$REGION = "ap-south-1"
$REPOSITORY = "devops-flask-app"
$IMAGE = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPOSITORY:v1"

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
docker build -f docker/Dockerfile -t $IMAGE .
docker push $IMAGE
```

If the ECR repository does not exist, create it first:

```powershell
aws ecr create-repository --repository-name devops-flask-app --region ap-south-1
```

## Deploy to EKS

The cluster used in the lab was named `devops-eks-cluster`. The AWS infrastructure is currently destroyed, so create/recreate the cluster before deploying.

```powershell
aws eks update-kubeconfig --region ap-south-1 --name devops-eks-cluster
kubectl get nodes
```

Before applying the deployment, replace the placeholder `ACCOUNT_ID` in `kubernetes/deployment.yaml` with your AWS account ID. You can get it with:

```powershell
aws sts get-caller-identity --query Account --output text
```

Then apply the manifests:

```powershell
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl rollout status deployment/devops-flask-deployment
```

Test the confirmed local access path:

```powershell
kubectl port-forward service/devops-flask-service 5000:5000
```

Open `http://localhost:5000/health`. NodePort **30080** is configured, but public access through it has not been verified. No Ingress is included in this project.

## Monitoring

The app exposes Prometheus metrics at `/metrics`. A ServiceMonitor is included in `monitoring/flask-servicemonitor.yaml`. See [monitoring setup](monitoring/README.md) for installing the kube-prometheus-stack with Helm and checking the target.

## Repository contents

- `app/` — Flask application and dependencies
- `docker/` — Dockerfile
- `kubernetes/` — Deployment, Service, and ConfigMap
- `monitoring/` — ServiceMonitor and monitoring setup guide
- `assets/` — earlier architecture asset
- `architecture-aws-flow-live.svg` — architecture image displayed above
- `terraform/` — Terraform source is not included yet; see `terraform/README.md`

## Current status and limitations

- The application was tested on EKS using `kubectl port-forward`.
- The ECR image was pushed during the lab; the manifest uses an account-ID placeholder that must be replaced before deploying.
- Public NodePort access was not verified.
- AWS resources were destroyed after testing to avoid charges.
- Terraform source files from the original lab are not currently in this repository, so the AWS infrastructure cannot be recreated from this repo alone.
- Monitoring was installed during the lab. The repo now includes a ServiceMonitor and setup guide, but monitoring has not been reinstalled and revalidated from this repository revision.

## What I learned

Containerizing an application, pushing images to ECR, deploying to EKS with Kubernetes, configuring health probes and resource limits, and exposing application metrics for Prometheus.
