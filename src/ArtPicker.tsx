import React from 'react';
import styled, { useTheme } from 'styled-components';
import contributors from './contributors.json';
import artData from './art.json';


type Contributor = typeof contributors.soundtomb;

const ArtPickerBox = styled.div`
    border: 1px solid ${props => props.theme.colors.brightLight};
    border-radius: 5px;
    padding: 10px;
    background-color: ${props => props.theme.colors.background};
    position: absolute;
`;

const ArtPicker: React.FC<{ artist: string }> = ({ artist }) => {
    const theme = useTheme();


    const artistInfo = contributors[artist as keyof typeof contributors];
    return (
        <ArtPickerBox>
            <h2>Change Artwork</h2>
            <ul>
                {
                    artData.map(art => (
                        <li>
                            <img src={art.url} alt="" />
                            {art.title}
                        </li>
                    ))
                }
            </ul>
        </ArtPickerBox>
    );
};

export default ArtPicker;
