from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        self.client.post("/login", json={"email":"mmiller5@ilstu.edu", "password":"fyhquz-dijfid-4Qommi"})

    @task
    def test_main_app(self):
        self.client.get("/app")
