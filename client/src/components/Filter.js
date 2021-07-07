import React from 'react';

const Filter = () => {
    const changeFilter = ()=> {
        console.log(document.querySelector('select#filter').value);
        document.getElementById('localVid').className = document.querySelector('select#filter').value;
    };
    return (  
        <div className="filters">
            <label >Filter: </label>
            <select id="filter" onChange = {changeFilter}>
                <option value="none">None</option>
                <option value="blur">Blur</option>
                <option value="grayscale">Grayscale</option>
                <option value="invert">Invert</option>
                <option value="sepia">Sepia</option>
            </select>
        </div>
    );
}
 
export default Filter;