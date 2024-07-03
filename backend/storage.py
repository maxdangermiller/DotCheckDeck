from azure.storage.blob import BlobServiceClient, generate_blob_sas, ContainerSasPermissions
from datetime import datetime, timedelta
import json
import os, time
from flask import send_from_directory


class StorageClient:
	def __init__(self) -> None:
		pass
	
	def get_file(self, path: str, filename: str):
		raise NotImplementedError
	
	def send_file(self, path: str, filename: str):
		raise NotImplementedError

	def save_file(self, path: str, filename: str, file):
		raise NotImplementedError
	
	def get_json(self, path: str, filename: str):
		raise NotImplementedError
	
	def save_json(self, path: str, filename:str, data):
		raise NotImplementedError


class LocalStorageClient(StorageClient):
	def __init__(self) -> None:
		super().__init__()

	def get_file(self, path: str, filename: str):
		with open(f"./backend/{path}/{filename}", "rb") as file: 
			return file
	
	def send_file(self, path: str, filename: str):
		return send_from_directory(f"./backend/{path}", filename)

	def save_file(self, path: str, filename: str, file):
		# Create Path if it doesn't exist
		doesExist = os.path.exists(f"./backend/{path}")
		if not doesExist:
			os.makedirs(f"./backend/{path}")

		file.save(f"./backend/{path}/{filename}")
	
	def get_json(self, path: str, filename: str):
		with open(f"./backend/{path}/{filename}", "r") as file: 
			return json.load(file, indent=4)
	
	def save_json(self, path: str, filename: str, data):
		with open(f"./backend/{path}/{filename}", "w") as file: 
			json.dump(data, file, indent=4)


class CloudStorageClient(StorageClient):
	def __init__(self) -> None:
		self.containers = list()

		# connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
		self.connect_str = "DefaultEndpointsProtocol=https;AccountName=dcdstorage;AccountKey=bmnJVBPHDQ6aAkGYIEb270FzNpXrlD50Z54hcqEjTbu48F1bDnPnFjyHIIJKDVF9fFgAPnBQgHdN+AStBwN7Tw==;EndpointSuffix=core.windows.net"
		self.container_name = "static"

		self.blob_service_client = BlobServiceClient.from_connection_string(self.connect_str)
		
		self.files = list()
		self.last_update = 0

	def get_container(self, container_name: str):
		# Check if we have it in self.containers
		for container in self.containers:
			if container.get_name() == container_name:
				return container
		
		# If not get it
		container = StorageContainer(self, container_name)
		self.containers.append(container)

		return container

	def update_files(self, path):
		if time.time() - self.last_update <= 10000:
			return

		path_list = path.split("/")
		container = self.get_container(path_list[0])
		container_client = container.get_client()

		blob_list = container_client.list_blobs()
		for blob in blob_list:
			print("\t" + blob.name)
			filename = blob.name.replace("-", "/")
			save_path = f"./{path_list[0]}/{filename}"

			with open(save_path, mode="wb") as download_file:
				download_file.write(container_client.download_blob(blob.name).readall())

		self.last_update = time.time()
		
	def get_file(self, path: str, filename: str):
		try:
			path_list = path.split("/")
			container = self.get_container(path_list[0])
			path_fixed = path.replace("/", "-")[len(path_list[0]) + 1:]

			container_client = container.get_client()

			container_client.download_blob(f"{path_fixed}-{filename}").readall()

			save_path = f"./{path}/{filename}"

			with open(save_path, mode="wb") as download_file:
				download_file.write(container_client.download_blob(f"{path_fixed}-{filename}").readall())
				return download_file
		except:
			raise FileNotFoundError(f"When trying to load file ({path_fixed}/{filename}) from the cloud, it wasn't found")
		
	def send_file(self, path: str, filename: str):
		self.update_files(path)
		return send_from_directory(path, filename)

	def save_file(self, path: str, filename: str, file):
		path_list = path.split("/")
		container = self.get_container(path_list[0])
		path_fixed = path.replace("/", "-")[len(path_list[0]) + 1:]

		return container.get_client().upload_blob(f"{path_fixed}-{filename}", file)


class StorageContainer:
	def __init__(self, client:StorageClient, name:str):
		self.client = client
		self.name = name
		try:
			self.container_client = client.blob_service_client.get_container_client(container=name)
			self.container_client.get_container_properties()
		except Exception as e:
			self.container_client = client.blob_service_client.create_container(name)

	def get_name(self):
		return self.name
	
	def get_client(self):
		return self.container_client



if __name__ == "__main__":
	sc = CloudStorageClient()

	# with open("static/1/1.svg", "rb") as file: 
	# 	sc.save_file("static/1", "1.svg", file)

	for file_path in os.listdir('static/5'):
		path = os.path.join("static/5", file_path)
		if os.path.isfile(path):
			with open(path, "rb") as file:
				sc.save_file("static/5", file_path, file)