from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

setup(
    name="buildsupply",
    version="1.0.0",
    description="BuildSupply Pro — Import & Wholesale Management for Construction Materials",
    author="Yosef",
    author_email="admin@buildsupply.et",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
