import { useState, useEffect } from "react";

const LiveRegion = ({ message, politeness = "polite" }) => {
    const [content, setContent] = useState("");

    useEffect(() => {
        setContent("");
        const id = setTimeout(() => setContent(message), 100);
        return () => clearTimeout(id);
    }, [message]);

    return (
        <div role="status" aria-live={politeness} aria-atomic="true" className="sr-only">
            {content}
        </div>
    );
};

export default LiveRegion;
