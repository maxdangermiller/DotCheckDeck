from locust import HttpUser, task, between

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMjIxMzc3MSwianRpIjoiM2Y4YTRiMTMtYzFkZC00ZmQ0LWFkOTctMDNiNzkyZjFmM2M3IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Im1heEBiZW5taWxsZXIuY29tIiwibmJmIjoxNzIyMjEzNzcxLCJleHAiOjE3MjIzMDAxNzF9.mFUDK3CPzVMULNwQ_U93gfUF6AL-p9LrQrL0nEDjBeE"
SHOW_CODE = "18UBYJYE"

class MainAppUser(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        pass
        # self.client.post("/login", json={"email":"mmiller5@ilstu.edu", "password":"fyhquz-dijfid-4Qommi"})

    @task
    def test_main_app(self):
        self.client.get(f"/sets?show_code={SHOW_CODE}&token={TOKEN}")
        self.client.get(f"/get-dots?show_code={SHOW_CODE}&set=5&token={TOKEN}")
        pass


    wait_time = between(10, 20)

class MainAppV2User(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        pass
        # self.client.post("/login", json={"email":"mmiller5@ilstu.edu", "password":"fyhquz-dijfid-4Qommi"})

    @task
    def test_main_app_v2(self):
        self.client.get(f"/api/get-data?show_code={SHOW_CODE}&data_section=0&token={TOKEN}")

    
    wait_time = between(10, 20)

       