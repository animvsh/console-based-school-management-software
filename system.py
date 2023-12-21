import re
import sqlite3
from datetime import datetime

conn = sqlite3.connect("school_database.db")
cursor = conn.cursor()



# Specify the path to your text file
file_path = "content.checker.txt"

try:
    # Open the file in read mode
    with open(file_path, 'r') as file:
        # Read the content of the file
        content = file.read().strip()  # Remove leading/trailing whitespace

        # Check the content
        if content == '0':
            cursor.executescript('''
                DROP TABLE IF EXISTS Teacher;
                DROP TABLE IF EXISTS Student;
                DROP TABLE IF EXISTS Class_Student;
                        
                CREATE TABLE Teacher (
                    teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date_of_entry DATE,
                    last_edit DATE,
                    name TEXT NOT NULL,
                    dob DATE,
                    classes_taught TEXT, -- Array of classes taught
                    contact_phone TEXT CHECK (LENGTH(contact_phone) = 10), -- 10-digit phone number
                    contact_email TEXT
                );
                                

                CREATE TABLE Class (
                    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date_of_entry DATE,
                    last_edit DATE,
                    class_name TEXT NOT NULL,
                    class_teacher_id INTEGER, -- Reference to the teacher
                    FOREIGN KEY (class_teacher_id) REFERENCES Teacher (teacher_id)
                );

                CREATE TABLE Student (
                    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date_of_entry DATE,
                    last_edit DATE,
                    name TEXT NOT NULL,
                    grade INTEGER,
                    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
                    dob DATE,
                    contact_phone TEXT CHECK (LENGTH(contact_phone) = 10),
                    contact_email TEXT
                );

                CREATE TABLE Class_Student (
                    class_id INTEGER,
                    student_id INTEGER,
                    PRIMARY KEY (class_id, student_id),
                    FOREIGN KEY (class_id) REFERENCES Class (class_id),
                    FOREIGN KEY (student_id) REFERENCES Student (student_id)
                );                    
            ''')
            with open(file_path, 'w') as file:
                file.write('1')
        else:
            pass
except FileNotFoundError:
    print(f"The system has been tampered with. shutting down...")
except Exception as e:
    print(f"An error occurred.")


# what can i simplify
#     find a way to verify emails, names and shi without writing lots of code


# this is a school software system that is run through the console.
# data is stored on the disk through sqlite databases

# the data that is stored is listed below
# date of entry - verification
# name
# grade - verification
# gender -- verification
# date of birth -- verification of format
# siblings names -- dict
# contact number -- verification
# email - verification

# teacher entry as well as their students

# status = 0 start
# status = 1 in progress
# status = 2 end it

# algorithm that utillizes the levenshtein algorithm in order to match 2 strings and determine their closeness
def string_distance(str1, str2):
    m, n = len(str1), len(str2)
    
    # Create a matrix to store the distances
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Initialize the matrix
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    # Fill in the matrix
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if str1[i - 1] == str2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1,  # Deletion
                          dp[i][j - 1] + 1,  # Insertion
                          dp[i - 1][j - 1] + cost)  # Substitution
    
    # The value at dp[m][n] is the Levenshtein distance
    return dp[m][n]

def find_word_index(word, word_list):
    try:
        index = word_list.index(word)
        return index
    except ValueError:
        # If the word is not in the list, the index() method raises a ValueError.
        return -1  # You can return -1 or any other value to indicate that the word is not in the list.

def input_checker(str1):
    checker = input(str1)
    if checker  == 'exit':
        print('exiting program...')
        print('your session ends here, thanks for using School Safe...')
        exit()
    return checker

# algorithm that will ask a question until it recieves a good answer \\\\ not done
def get_answer(question, list_of_answers):
    continuation_status = 0
    while continuation_status == 0: 
        q = input_checker(question).lower()
        if q == 'exit': 
            print('thanks for using school safe, your session ends here')
            # Commit the changes and close the database connection
            conn.commit()
            conn.close()
            exit()
        tracker = 0
        count = 0
        index = find_word_index(q, list_of_answers)
        if index > -1:
            return list_of_answers[index]
        else:
            answer = ''
            for a in list_of_answers:
                if count == 0:
                    tracker = string_distance(q, a)
                    answer = a
                elif tracker > string_distance(q,a):
                    tracker = string_distance(q, a)
                    answer = a
                count = count + 1

            confirmation_string = 'Did you mean ' + answer + '? (y/n)'
            confirmation = input_checker(confirmation_string).lower()
            if confirmation == 'y':
                print('interpretation successful...')
                continuation_status = 1
                return answer

            else: 
                print('Im sorry, please try again...')
                    

# program to help verify date of birth formatting, put in a function to make cleaner code
def is_valid_date_of_birth(date_str):
    # Define a regular expression pattern for date of birth in the format "YYYY-MM-DD"
    dob_pattern = r'^\d{4}-\d{2}-\d{2}$'

    # Use the re.match() function to check if the string matches the pattern
    if re.match(dob_pattern, date_str):
        # If it matches, check if it's a valid date using Python's datetime module
        try:
            from datetime import datetime
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    else:
        return False

# program to help verify the eligibility of the given email
def is_valid_email(email):
    # Define a regular expression pattern for a basic email format
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'

    # Use the re.match() function to check if the email matches the pattern
    if re.match(email_pattern, email):
        return True
    else:
        return False

               

status = 0
print('Welcome To School Safe: The premier school management system!')
# action = input('request action (show, add, edit, exit)').lower()
action = get_answer('request action (show, add, edit, exit) ', ['show', 'add', 'edit', 'exit'])


while action == 'show' or action == 'add' or action == 'exit':
    if action == 'exit':
        print('thanks for using school safe, your session ends here')
        break;
    elif action == 'show':
        # write code to show the table
        print("wdp-")
    elif action == 'edit':
        # write shi for editing the database
        # find a way to edit any part of the database
        print("wdp")

        edit_class = get_answer('What would you like to edit? (class, teacher, student): ', ['class', 'teacher', 'student'])
        if edit_class == 'student':
            edit_class_student = input_checker('What student would you like to edit the information of: ')
            # show the information of that student
            # ask the user what they would want to edit about
        elif edit_class == 'teacher':
            edit_class_teacher = input_checker('What teacher would you like to edit the information of: ')
        elif edit_class == 'class':
            edit_class_class = input_checker('What class would you like to edit the information of: ')
    elif action == 'add': 
        # this is when you input stuff to the database
        # the data that is stored is listed below
            # teacher or student
            # date of entry - verification
            # name
            # grade - verification
            # gender -- verification
            # date of birth -- verification of format
            # siblings names -- dict
            # contact number -- verification
            # email - verification
                
        class_picker = get_answer('what would you like to add? (student/teacher/class)', ['student', 'teacher', 'class'])
        
        status = 0
        while status == 0:
            if class_picker == 'student':
                name = 0
                grade = 0
                gender = 0
                dob = 0
                sibling_names = 0
                contact_number = 0
                contact_email = 0

                # store the following information for student
                #     date of entry
                #     name
                #     classes
                #     grade
                #     gender
                #     dob
                #     sibling names
                #     contact number 
                #     contact email
                while True:
                    name = input_checker('add student name: ').lower()
                    if name.isalpha():
                        break
                    else:
                        print('this name is invalid because it has numbers, try again')
                while True:
                    grade = input_checker('add student grade: ').lower()

                    if grade.isdigit():
                        break
                    else:
                        print('input is not a number, try again')
                
                gender = get_answer('input their gender(male/female/other): ', ['male', 'female', 'other'])
                while True:
                    dob = input_checker('input their date of birth (yyyy-mm-dd): ').strip()
                    if is_valid_date_of_birth(dob) == True:
                        break
                    else:
                        print('invalid input or format, please try again...')
                # while True:
                #     sibling_names = input_checker('please list students siblings full name and seperate them by comma. if no siblings, type n/a: ').lower()
                #     sibling_names = sibling_names.split(',')
                #     if sibling_names == 'n/a':
                #         sibling_names = []
                #         break
                #     sibling_name_confirmation = True
                #     for a in sibling_names:
                #         a = a.strip()
                #         if not a.isalpha():
                #             sibling_name_confirmation = False
                #             print('The following sibling name is an invalid input: ' + a + ' ')
                #     if sibling_name_confirmation:
                #         break
                while True:
                    contact_number = input_checker('input the contact number of the student: ')

                    if contact_number.isdigit() and len(contact_number) == 10:
                        print('number saved...')
                        break
                    else: 
                        print('invalid number, please try again')
                while True: 
                    contact_email = input_checker('input the contact email of the student: ').lower()

                    if is_valid_email(contact_email):
                        print('email verified and saved...')
                        break
                    else: 
                        print('email invalid, please input again...')
                        # SUGGESTION: to make this better, try sending a confirmation email with a code or sum and have them verify it
                

                # COMMENT: inputting the data into the database
                date_of_entry = datetime.now().strftime("%Y-%m-%d")
                cursor.execute(
                    "INSERT INTO Student (date_of_entry, last_edit, name, grade, gender, dob, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (date_of_entry, date_of_entry, name, grade, gender, dob, contact_number, contact_email)
                )
                conn.commit()
            elif class_picker == 'teacher':
                name = 0
                class_taught = 0
                dob = 0
                contact_number = 0
                contact_email = 0

                while True:
                    name = input_checker('add teacher full name: ').lower()

                    if name.isalpha():
                        break
                    else:
                        print('this name is invalid because it has numbers, try again')

                class_taught = input_checker('list the classes that this teacher will teach, if multiple, seperate them with commas: ').lower().strip()                
                class_taught = class_taught.split(',')

                while True:
                    contact_number = input_checker('input the contact number of the teacher: ')
                    if contact_number.isdigit() and len(contact_number) == 10:
                        print('number saved...')
                        break
                    else: 
                        print('invalid number, please try again')
                while True:
                    contact_email = input_checker('input the contact email of the teacher: ').lower()
                    if is_valid_email(contact_email):
                        print('email verified and saved...')
                    else: 
                        print('email invalid, please input again...')
                        # to make this better, try sending a confirmation email with a code or sum and have them verify it
            elif class_picker == 'class':
                class_name = input_checker('add class name').lower()
                class_name_confirmation = get_answer('Confirm adding the following class (y/n): ' + class_name + ' ')
                if class_name_confirmation == 'y':
                    print('class verified and added...')
                else: 
                    print('im sorry, lets try that again...')
                



