import * as JsonURL from "json-url";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { MAX_WIDTH, WIDTH, WIDTH_INCREMENT_FACTOR } from "../settings";

/**
 * It manages the pattern and its changes
 */
export function usePattern(initialPattern) {
  // The current pattern
  const [pattern, setPattern] = useState(initialPattern);

  // The current width of the pattern board
  const [currWidth, setCurrWidth] = useState(WIDTH);

  // Compression algorithm
  const compression_agent = JsonURL("lzma");

  // Popup agent
  const Popup = withReactContent(Swal);

  // A deep copy of the pattern
  const getPatternCopy = () => {
    return JSON.parse(JSON.stringify(pattern));
  };

  // It handles simple changes in pattern
  const handlePatternChange = async ({ x, y, value }) => {
    const patternCopy = getPatternCopy();
    patternCopy[x][y] = +!value;
    await setPattern(patternCopy);
  };

  // Cleans all active cells
  const cleanPattern = () => {
    setPattern(initialPattern);
    setCurrWidth(WIDTH);
  };

  const sharePattern = async () => {
    let music = {currWidth: currWidth, content: []};

    pattern.forEach((row, x) => {
      row.forEach((cell, y) => {
        if (cell) {
          music.content.push([x, y]);
        }
      });
    });

    const compressed_cells = await compression_agent.compress(music);
    const current_url =  window.location.href.split('?')[0];
    
    const final_url = `${current_url}?music=${compressed_cells}`;

    Popup.fire({
      title: 'Compartilhe a sua obra',
      html: `<input id="swal-input1" class="swal2-input" value=${final_url} disabled/>`,
      confirmButtonText: 'Copiar',
      confirmButtonColor: '#3085d6',
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) { 
        navigator.clipboard.writeText(final_url).then(function() {
          Popup.fire(
            'Copiado!',
            'Só falta enviar para os seus amigos :)',
            'success'
          )
        }, function(err) {
          console.error('Async: Could not copy text: ', err);
        });
      }
    });
  };

  // It checks if there is a pattern in the URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const music = queryParams.get("music");

    if (music) {
      compression_agent.decompress(music).then((result) => {
        const {currWidth, content} = result;

        const patternCopy = getPatternCopy();
        updateWidth(currWidth, patternCopy);
        
        for (let point of content) {
          patternCopy[point[0]][point[1]] = 1;
        }
        
        setCurrWidth(currWidth);
        setPattern(patternCopy);
      });
    }
  }, []);

  /**
   * Updates width of a pattern given a new current width
  */
  const updateWidth = (currWidth, patternCopy) => {
    const diff = currWidth - pattern[0].length;

    if (diff !== 0) {
        for (let row of patternCopy) {
          for (let i = 0; i < Math.abs(diff); i++) {
            if (diff > 0) {
              row.push(0);
            } else {
              row.pop();
            }
          }
        }
    }
  }

  /**
   * Reflecting change on current width
  */
  useEffect(() => {
    const patternCopy = getPatternCopy();
    updateWidth(currWidth, patternCopy);
    setPattern(patternCopy);
  }, [currWidth]);
  
  /**
   * It increments the size of the board
   */
  const incrementWidth = () => {
    setCurrWidth((oldWidth) =>
      Math.min(oldWidth + WIDTH_INCREMENT_FACTOR, MAX_WIDTH)
    );
  };

  /**
   * It decrements the size of the board
   */
  const decrementWidth = () => {
    setCurrWidth((oldWidth) =>
      Math.max(oldWidth - WIDTH_INCREMENT_FACTOR, WIDTH)
    );
  };

  return {
    pattern,
    setPattern,
    currWidth,
    handlePatternChange,
    cleanPattern,
    sharePattern,
    incrementWidth,
    decrementWidth,
  };
}
