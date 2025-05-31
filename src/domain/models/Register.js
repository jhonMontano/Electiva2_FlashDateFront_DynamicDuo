export default class Register {
  constructor({ id, name, lastName, birthday, email, password, gender, preferences, location, description, profilePhoto = [] }) {
    this.id = id;
    this.name = name;
    this.lastName = lastName;
    this.birthday = birthday;
    this.email = email;
    this.password = password;
    this.gender = gender;
    this.preferences = preferences;
    this.location = location;
    this.description = description;
    this.profilePhoto = Array.isArray(profilePhoto) ? profilePhoto : [profilePhoto];

  }
}
