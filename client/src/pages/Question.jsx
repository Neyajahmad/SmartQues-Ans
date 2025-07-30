import { useState } from "react";

import axios from "axios";

import { serverEndpoint } from "../config/appConfig";

import './index.css'; // Import the new CSS file



function Question({ roomCode }) {

    const [question, setQuestion] = useState("");

    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState(false);



    const validate = () => {

        const newErrors = {};

        let isValid = true;



        if (question.trim().length === 0) {

            isValid = false;

            newErrors.question = "Your question cannot be empty.";

        }



        setErrors(newErrors);

        return isValid;

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        setSuccess(false); // Reset success state on new submission



        if (validate()) {

            setLoading(true);

            setErrors({});

            try {

                const participantName = localStorage.getItem("participant-name");

                await axios.post(

                    `${serverEndpoint}/room/${roomCode}/question`,

                    {

                        content: question,

                        user: participantName ? participantName : "Anonymous",

                    },

                    {

                        withCredentials: true,

                    }

                );

                setQuestion("");

                setSuccess(true);

                setTimeout(() => setSuccess(false), 3000); // Hide success message after 3 seconds

            } catch (error) {

                console.error("Error posting question:", error);

                setErrors({

                    api: "Could not submit your question. Please try again.",

                });

            } finally {

                setLoading(false);

            }

        }

    };



    return (

        <div className="question-form-wrapper">

            <div className="question-form-container">

                <form onSubmit={handleSubmit} noValidate>

                    <h3 className="form-title">

                        <i className="fas fa-question-circle"></i> Ask a Question

                    </h3>

                    <p className="form-subtitle">

                        Your question will be submitted to the host for review.

                    </p>



                    {errors.api && <div className="alert alert-danger">{errors.api}</div>}

                    {success && <div className="alert alert-success">Question submitted successfully!</div>}



                    <div className="textarea-group">

                        <textarea

                            id="question"

                            name="question"

                            className={errors.question ? "textarea-field is-invalid" : "textarea-field"}

                            rows="4"

                            value={question}

                            onChange={(e) => setQuestion(e.target.value)}

                            placeholder="Type your question here..."

                            disabled={loading}

                        />

                        {errors.question && <div className="error-feedback">{errors.question}</div>}

                    </div>



                    <button

                        type="submit"

                        className="submit-btn"

                        disabled={loading}

                    >

                        {loading ? (

                            <>

                                <span className="spinner"></span> Submitting...

                            </>

                        ) : (

                            'Submit Question'

                        )}

                    </button>

                </form>

            </div>

        </div>

    );

}



export default Question;