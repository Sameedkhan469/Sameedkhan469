<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./light.svg">
  <img alt="Sameed Khan — AWS DevOps, Systems Administration and Networking" src="./light.svg" width="100%">
</picture>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=21&pause=1200&color=36BCF7&center=true&vCenter=true&width=760&lines=AWS+DevOps+%7C+Terraform+Infrastructure+as+Code;Jenkins+CI%2FCD+%7C+Maven+Build+Pipelines;Prometheus+%7C+Grafana+%7C+Splunk;Systems+Administration+%7C+Networking" alt="Typing animation" />
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/sameed-khan-a6824538a/">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/Sameedkhan469?tab=repositories">
    <img src="https://img.shields.io/badge/GitHub-Repositories-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub repositories" />
  </a>
  <img src="https://komarev.com/ghpvc/?username=Sameedkhan469&label=Profile%20Views&color=0e75b6&style=for-the-badge" alt="Profile views" />
</p>

## About Me

Hi, I'm **Sameed Khan**, a systems and networking professional building practical skills in **AWS DevOps**. My background includes Windows and Linux administration, network connectivity troubleshooting, user access and permissions, and infrastructure support. In my hands-on projects, I use **Terraform** to define AWS infrastructure, **Jenkins** to automate build and infrastructure-check pipelines, and **Prometheus + Grafana** to monitor EC2 systems.

I like solving infrastructure problems step by step, documenting what I build, and improving the repeatability and security of cloud environments.

## Technical Skills

### AWS Cloud & Infrastructure as Code

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Amazon EC2](https://img.shields.io/badge/Amazon_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)
![Amazon S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)
![Amazon RDS](https://img.shields.io/badge/Amazon_RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white)

- **AWS:** EC2, VPC, public/private subnets, route tables, Internet Gateway, NAT Gateway, Security Groups, Application Load Balancer, RDS MySQL, IAM roles, S3, Lambda and Systems Manager.
- **Terraform:** variables, outputs, state concepts, S3 remote-backend concepts and versioning, root/child and Registry modules, data sources, `count`, `for_each`, dynamic blocks, and `local-exec`/`remote-exec` provisioners.

### CI/CD, Monitoring & Logging

![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![Maven](https://img.shields.io/badge/Apache_Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Splunk](https://img.shields.io/badge/Splunk-000000?style=for-the-badge&logo=splunk&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

- **CI/CD:** Jenkins declarative pipelines/Jenkinsfile, Maven build/test/package workflow, JAR artifact archiving, GitHub webhooks, and Terraform `fmt`, `validate` and `plan` checks.
- **Monitoring & logging:** Prometheus, Node Exporter, Grafana dashboards, CPU/memory/disk metrics, server availability, Splunk Universal Forwarder and Splunk indexer.

### Systems, Scripting, Applications & Networking

![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Bash](https://img.shields.io/badge/Bash-4EAA25?style=for-the-badge&logo=gnubash&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)

- **Systems:** Linux (Ubuntu/Amazon Linux), Windows, systemd, user permissions, package management and system logs.
- **Scripting & tools:** Bash, Python, Boto3 and AWS CLI.
- **Applications & databases:** Nginx reverse proxy, Flask and MySQL.
- **Networking:** TCP/IP, DNS, DHCP, HTTP/HTTPS, SSH, routing, switching, LAN/WAN, CIDR/subnetting, NAT and load balancing.

## Featured Projects

| Project | What it demonstrates |
|:--|:--|
| [**AWS EC2 Monitoring — Prometheus & Grafana**](https://github.com/Sameedkhan469/Grafana-Prometheus) | Terraform-managed AWS network and two Ubuntu EC2 instances; Prometheus, Node Exporter and Grafana dashboards for CPU, memory, disk and availability. The README notes that the services are installed directly on Ubuntu, not Docker. |
| [**Multi-Tier E-Commerce on AWS**](https://github.com/Sameedkhan469/sameed-ecommerce-aws-terraform) | Terraform-defined Nginx frontend, private Flask backend and private RDS MySQL database, tier-specific Security Groups, NAT routing and Systems Manager access. |
| [**AWS Three-Tier Infrastructure**](https://github.com/Sameedkhan469/Terraform-Three-Tier-Project) | Terraform configuration for a VPC, eight tier-specific subnets across two Availability Zones, HTTP Application Load Balancer, Nginx frontend EC2 instances, backend instances and private RDS MySQL. This is an infrastructure learning project; the repository documents that the complete frontend-to-backend application workflow is not yet implemented. |
| [**Jenkins CI/CD + Terraform**](https://github.com/Sameedkhan469/jenkins-cicd-practice) | Jenkins pipeline for Terraform checkout, init, format, validate and plan steps, plus Terraform configuration for AWS infrastructure hosting Jenkins. |
| [**Maven Build Pipeline**](https://github.com/Sameedkhan469/sameed-maven-project) | Maven Java project with a Jenkinsfile for compile, test and package stages, with JAR artifact archiving and success/failure handling. |
| [**Terraform Practice Labs**](https://github.com/Sameedkhan469/terraform-practice) | Daily hands-on labs including state/backend concepts, EC2, modules, provisioners, `null_resource`, dynamic Security Group rules, `count` and `for_each`. |
| [**Linux Commands for DevOps & Cloud**](https://github.com/Sameedkhan469/Linux-commands) | A reference for Linux file and user management, permissions, processes, packages, networking, storage, monitoring, services, shell scripting, logs and common DevOps commands. |

## Professional Experience

- **Networking Engineer — F2TH Communication Private Ltd** · Bengaluru, India · 8 months  
  Troubleshooting connectivity, routing, IP addressing, DNS/DHCP and TCP/IP; configuring and troubleshooting network devices; investigating infrastructure faults.
- **System Administrator — DN Computers** · 1 year 6 months  
  Windows/Linux administration, software installation and updates, user accounts and permissions, operating-system and hardware troubleshooting, file sharing, backups and basic security controls.

## Education & Training

- **Bachelor of Computer Applications (BCA)** — Arunodaya University · 2021–2024
- **Diploma in Cloud Computing** — Jetking
- **AWS Solutions Architecture Job Simulation** — Forage

## Next Learning Goals

I am strengthening my practical DevOps toolkit in the next stages:

- Docker and Docker Compose
- Kubernetes fundamentals and AWS EKS
- Ansible for configuration management
- End-to-end CI/CD deployment and release practices

These are learning goals, not a claim that these tools are already demonstrated in the featured repositories.

## GitHub Stats

<p align="center">
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=Sameedkhan469&show_icons=true&hide_border=true&theme=tokyonight&rank_icon=github" alt="Sameed Khan's GitHub statistics" />
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=Sameedkhan469&layout=compact&hide_border=true&theme=tokyonight" alt="Most used languages" />
  <br>
  <img src="https://streak-stats.demolab.com?user=Sameedkhan469&theme=tokyonight&hide_border=true" alt="GitHub contribution streak" />
</p>

## Contribution Snake

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sameedkhan469/Sameedkhan469/output/github-contribution-grid-snake-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Sameedkhan469/Sameedkhan469/output/github-contribution-grid-snake.svg" />
    <img alt="GitHub contribution graph snake animation" src="https://raw.githubusercontent.com/Sameedkhan469/Sameedkhan469/output/github-contribution-grid-snake.svg" />
  </picture>
</p>

> The contribution animation is generated by the GitHub Actions workflow in `.github/workflows/snake.yml`. It will appear after the workflow runs successfully and publishes the `output` branch.

## Connect

<p align="center">
  <a href="https://www.linkedin.com/in/sameed-khan-a6824538a/">
    <img src="https://img.shields.io/badge/LinkedIn-Sameed_Khan-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/Sameedkhan469">
    <img src="https://img.shields.io/badge/GitHub-Sameedkhan469-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</p>

<p align="center"><b>Build • Automate • Deploy • Monitor</b></p>
