import json


class Game:
    def __init__(self):
        self.width = 960
        self.height = 540
        self.started = False
        self.won = False
        self.celebrate_t = 0
        self.celebrate_frames = 110
        self.announce_frames = 90
        self.announcing = False
        self.announce_t = 0
        self.keys = set()
        self.jump_edge = False
        self.speed = 4.2
        self.jump_vx = 4.5
        self.gravity = 0.48
        self.jump_speed = -7.6
        self.feet = 40
        self.facing = 1
        self.vx = 0
        self.vy = 0
        self.on_ground = True
        self.level = 1
        self.lives = 3
        self.life_pause = 0
        self.life_pause_frames = 75
        self.game_over = False
        self.ride_index = None
        self.ride_cloud = None
        self.movers = []
        self.clouds = []
        self.fireball = None
        self._load_level(1)

    def _top(self, platform):
        return platform["y"] - platform["r"] * 0.42

    def _half(self, platform):
        return platform["r"] * 0.8

    def _circle(self, x, top, radius):
        return {"x": x, "y": top + radius * 0.42, "r": radius}

    def _mover(self, x, top, radius, left, right, direction, speed):
        return {
            "x": x,
            "y": top + radius * 0.42,
            "r": radius,
            "left": left,
            "right": right,
            "dir": direction,
            "speed": speed,
        }

    def _cloud(self, x, top, radius, rise, speed, start):
        center = top + radius * 0.42
        high = center - rise
        low = center + rise
        # start 0 is the bottom of the path and rises; start 1 is the top and lowers.
        if start == 0:
            y = low
            direction = -1
        else:
            y = high
            direction = 1
        return {
            "x": x,
            "y": y,
            "r": radius,
            "high": high,
            "low": low,
            "dir": direction,
            "speed": speed,
        }

    def _load_level(self, level):
        self.level = level
        self.lives = 3
        self.life_pause = 0
        self.game_over = False
        self.won = False
        self.celebrate_t = 0
        self.jump_edge = False
        self.ride_index = None
        self.ride_cloud = None
        self.movers = []
        self.clouds = []
        self.fireball = None
        self.announcing = False

        if level == 1:
            top = 371.0
            self.platforms = [
                self._circle(130, top, 50),
                self._circle(268, top, 50),
                self._circle(406, top, 50),
            ]
            self.goal = {"x": 490, "y": top, "w": 130, "h": 16}
            self.pond = {"x": 820, "y": 470, "rx": 120, "ry": 58}
        elif level == 2:
            top = 376.0
            self.platforms = [self._circle(70, top, 40)]
            self.movers = [
                self._mover(210, top, 56, 175, 245, 1, 0.55),
                self._mover(350, top, 78, 320, 375, 1, 0.35),
            ]
            self.goal = {"x": 450, "y": top, "w": 190, "h": 16}
            self.pond = {"x": 860, "y": 478, "rx": 100, "ry": 50}
            self._begin_announcement()
        else:
            top = 360.0
            self.platforms = [self._circle(80, top, 46)]
            self.clouds = [
                self._cloud(230, top, 72, 28, 0.22, 0),
                self._cloud(400, top, 76, 28, 0.22, 1),
            ]
            self.fireball = {
                "x": 300,
                "y": top - 18,
                "r": 16,
                "left": 285,
                "right": 325,
                "dir": 1,
                "speed": 0.35,
            }
            self.goal = {"x": 470, "y": top, "w": 170, "h": 16}
            self.pond = {"x": 860, "y": 470, "rx": 100, "ry": 52}
            self._begin_announcement()

        self._place_on_first()

    def _begin_announcement(self):
        self.announcing = True
        self.announce_t = 0
        self.keys.clear()
        self.jump_edge = False

    def _place_on_first(self):
        first = self.platforms[0]
        self.duck_x = first["x"]
        self.duck_y = self._top(first) - self.feet
        self.vx = 0
        self.vy = 0
        self.on_ground = True
        self.ride_index = None
        self.ride_cloud = None
        self.facing = 1

    def handle_input(self, key, is_down):
        if self.game_over:
            if is_down and key == "KeyR":
                self.started = False
                self.keys.clear()
                self._load_level(1)
            return
        if self.announcing or self.life_pause > 0:
            return
        if is_down:
            fresh = key not in self.keys
            self.keys.add(key)
            if key == "Space" and not self.won:
                self.started = True
            if fresh and key == "ArrowUp" and self.started and not self.won:
                self.jump_edge = True
        else:
            self.keys.discard(key)

    def update(self):
        if not self.started or self.game_over:
            return
        if self.life_pause > 0:
            self.life_pause -= 1
            if self.life_pause == 0:
                self._place_on_first()
            return
        if self.won:
            self._celebrate()
            return
        if self.announcing:
            self.announce_t += 1
            if self.announce_t >= self.announce_frames:
                self.announcing = False
                self.jump_edge = False
                self.keys.clear()
            return

        self._move_actors()

        if self.jump_edge:
            self.jump_edge = False
            if self.on_ground:
                self.vy = self.jump_speed
                self.vx = self.jump_vx
                self.on_ground = False
                self.ride_index = None
                self.ride_cloud = None
                self.facing = 1

        if self.on_ground:
            moving = 0
            if "ArrowLeft" in self.keys:
                moving -= 1
            if "ArrowRight" in self.keys:
                moving += 1
            if moving != 0:
                self.facing = moving
                self.duck_x += moving * self.speed
        else:
            self.duck_x += self.vx

        self.duck_x = max(24, min(self.width - 24, self.duck_x))

        if self.on_ground and self._surface_under_feet() is None:
            self.on_ground = False
            self.ride_index = None
            self.ride_cloud = None

        if not self.on_ground:
            self.vy += self.gravity
            previous_feet = self.duck_y + self.feet
            self.duck_y += self.vy
            self._land_if_crossed(previous_feet)

        if self._hit_fireball() or self.duck_y > self.height - 30:
            self._respawn()
            return

        if self.on_ground and self._on_carpet():
            self.won = True
            self.facing = 1

    def _move_actors(self):
        for index, mover in enumerate(self.movers):
            previous = mover["x"]
            mover["x"] += mover["speed"] * mover["dir"]
            if mover["x"] >= mover["right"]:
                mover["x"] = mover["right"]
                mover["dir"] = -1
            elif mover["x"] <= mover["left"]:
                mover["x"] = mover["left"]
                mover["dir"] = 1
            if self.on_ground and self.ride_index == index:
                self.duck_x += mover["x"] - previous

        for index, cloud in enumerate(self.clouds):
            previous = cloud["y"]
            cloud["y"] += cloud["speed"] * cloud["dir"]
            if cloud["y"] >= cloud["low"]:
                cloud["y"] = cloud["low"]
                cloud["dir"] = -1
            elif cloud["y"] <= cloud["high"]:
                cloud["y"] = cloud["high"]
                cloud["dir"] = 1
            if self.on_ground and self.ride_cloud == index:
                self.duck_y += cloud["y"] - previous

        if self.fireball:
            hazard = self.fireball
            hazard["x"] += hazard["speed"] * hazard["dir"]
            if hazard["x"] >= hazard["right"]:
                hazard["x"] = hazard["right"]
                hazard["dir"] = -1
            elif hazard["x"] <= hazard["left"]:
                hazard["x"] = hazard["left"]
                hazard["dir"] = 1

    def _carpet_top(self):
        goal = self.goal
        if goal["x"] <= self.duck_x <= goal["x"] + goal["w"]:
            return goal["y"]
        return None

    def _surfaces(self):
        found = []
        for platform in self.platforms:
            if abs(self.duck_x - platform["x"]) <= self._half(platform):
                found.append(self._top(platform))
        for mover in self.movers:
            if abs(self.duck_x - mover["x"]) <= self._half(mover):
                found.append(self._top(mover))
        for cloud in self.clouds:
            if abs(self.duck_x - cloud["x"]) <= self._half(cloud):
                found.append(self._top(cloud))
        carpet = self._carpet_top()
        if carpet is not None:
            found.append(carpet)
        return found

    def _surface_under_feet(self):
        feet = self.duck_y + self.feet
        matches = [surface for surface in self._surfaces() if abs(feet - surface) <= 4]
        if not matches:
            return None
        return min(matches)

    def _land_if_crossed(self, previous_feet):
        if self.vy < 0:
            return

        feet = self.duck_y + self.feet
        crossed = [
            surface
            for surface in self._surfaces()
            if previous_feet <= surface + 2 and feet >= surface
        ]
        if not crossed:
            return

        surface = min(crossed)
        self.duck_y = surface - self.feet
        self.vx = 0
        self.vy = 0
        self.on_ground = True
        self.ride_index = self._mover_under_feet()
        self.ride_cloud = None if self.ride_index is not None else self._cloud_under_feet()

    def _mover_under_feet(self):
        feet = self.duck_y + self.feet
        for index, mover in enumerate(self.movers):
            if abs(self.duck_x - mover["x"]) <= self._half(mover) and abs(feet - self._top(mover)) <= 4:
                return index
        return None

    def _cloud_under_feet(self):
        feet = self.duck_y + self.feet
        for index, cloud in enumerate(self.clouds):
            if abs(self.duck_x - cloud["x"]) <= self._half(cloud) and abs(feet - self._top(cloud)) <= 4:
                return index
        return None

    def _hit_fireball(self):
        if not self.fireball:
            return False
        hazard = self.fireball
        dx = self.duck_x - hazard["x"]
        dy = (self.duck_y + 8) - hazard["y"]
        reach = 30 + hazard["r"]
        return dx * dx + dy * dy <= reach * reach

    def _respawn(self):
        if self.life_pause > 0 or self.game_over:
            return
        self.lives -= 1
        self.vx = 0
        self.vy = 0
        self.jump_edge = False
        self.keys.clear()
        if self.lives <= 0:
            self.lives = 0
            self.game_over = True
            return
        self.life_pause = self.life_pause_frames

    def _on_carpet(self):
        carpet = self._carpet_top()
        if carpet is None:
            return False
        return abs((self.duck_y + self.feet) - carpet) <= 4

    def _celebrate(self):
        self.celebrate_t += 1
        target_x = self.pond["x"] + 8
        target_y = self.pond["y"] - 16
        self.duck_x += (target_x - self.duck_x) * 0.07
        self.duck_y += (target_y - self.duck_y) * 0.07
        self.facing = 1
        if self.celebrate_t >= self.celebrate_frames and self.level < 3:
            self._load_level(self.level + 1)

    def _platform_views(self):
        views = [
            {"x": platform["x"], "y": platform["y"], "r": platform["r"], "moving": False}
            for platform in self.platforms
        ]
        for mover in self.movers:
            views.append({"x": mover["x"], "y": mover["y"], "r": mover["r"], "moving": True, "cloud": False})
        for cloud in self.clouds:
            views.append({"x": cloud["x"], "y": cloud["y"], "r": cloud["r"], "moving": True, "cloud": True})
        return views

    def to_json(self):
        return json.dumps(
            {
                "started": self.started,
                "won": self.won,
                "announce": self.announcing,
                "celebrateT": self.celebrate_t,
                "width": self.width,
                "height": self.height,
                "level": self.level,
                "lives": self.lives,
                "lifeMessage": f"Life lost — {self.lives} remaining" if self.life_pause > 0 else "",
                "gameOver": self.game_over,
                "duck": {
                    "x": self.duck_x,
                    "y": self.duck_y,
                    "vy": self.vy,
                    "facing": self.facing,
                    "onGround": self.on_ground,
                },
                "platforms": self._platform_views(),
                "hazards": [self.fireball] if self.fireball else [],
                "goal": self.goal,
                "pond": self.pond,
            }
        )


game = Game()


def handle_input(key, is_down):
    game.handle_input(str(key), int(is_down) == 1)


def update():
    game.update()


def get_state():
    return game.to_json()
