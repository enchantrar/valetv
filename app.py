import json
import random
from flask import Flask, render_template, jsonify

app = Flask(__name__)

def load_programs():
    with open("data/programs.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.route("/")
def index():
    programs = load_programs()
    sitcom   = [p for p in programs if p["category"] == "sitcom"]
    reality  = [p for p in programs if p["category"] == "reality"]
    show     = [p for p in programs if p["category"] == "show"]
    return render_template("index.html",
                           sitcom=sitcom,
                           reality=reality,
                           show=show)

@app.route("/program/<slug>")
def program(slug):
    programs = load_programs()
    p = next((p for p in programs if p["slug"] == slug), None)
    if not p:
        return "Bulunamadı", 404
    return render_template("program.html", p=p)

@app.route("/api/random")
def random_program():
    programs = load_programs()
    return jsonify(random.choice(programs))

@app.route("/api/programs")
def all_programs():
    return jsonify(load_programs())

if __name__ == "__main__":
    app.run(debug=True)
