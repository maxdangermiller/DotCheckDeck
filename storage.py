from azure.storage.blob import BlobServiceClient
import os

class StorageClient:
	def __init__(self, use_cloud) -> None:
		# connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
		self.connect_str = "DefaultEndpointsProtocol=https;AccountName=dcdstorage;AccountKey=bmnJVBPHDQ6aAkGYIEb270FzNpXrlD50Z54hcqEjTbu48F1bDnPnFjyHIIJKDVF9fFgAPnBQgHdN+AStBwN7Tw==;EndpointSuffix=core.windows.net"
		self.container_name = "static"
		self.use_cloud = use_cloud

		self.blob_service_client = BlobServiceClient.from_connection_string(self.connect_str)
	
	def get_container(self, name):
		return StorageContainer(self, name)


class StorageContainer:
	def __init__(self, client:StorageClient, name:str):
		self.client = client
		self.name = name
		try:
			self.container_client = client.blob_service_client.get_container_client(container=name)
			self.container_client.get_container_properties()
		except Exception as e:
			self.container_client = client.blob_service_client.create_container(name)
	
	def get_client(self):
		return self.container_client
	
	def save_file(self, filename, file):
		if self.client.use_cloud:
			self.get_client().upload_blob(filename, file)
		else:
			doesExist = os.path.exists(f"./static/{self.name}")
			if not doesExist:
				os.makedirs(f"./static/{self.name}")
								
			with open(f"static/{self.name}/{filename}", "w") as file_w: 
				file_w.writelines(file.readlines())



if __name__ == "__main__":
	sc = StorageClient(False)
	scon = sc.get_container("static-1")

	with open("static/1/1.svg", "r") as file: 
		scon.save_file("1.svg", file)
