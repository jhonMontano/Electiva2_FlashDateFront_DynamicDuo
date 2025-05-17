export default class Register {
  constructor({ id, name, lastName, birthday, email, password, gender, preferences, location, profilePhoto = [] }) {
    this.id = id;
    this.name = name;
    this.lastName = lastName;
    this.birthday = birthday;
    this.email = email;
    this.password = password;
    this.gender = gender;
    this.preferences = preferences;
    this.location = location;
    this.profilePhoto = Array.isArray(profilePhoto) ? profilePhoto : [profilePhoto];

    console.log("🔧 Register class initialized:", this);
  }
}
